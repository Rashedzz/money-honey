import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, View, Text } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import DatabaseProviderWMDB from '@nozbe/watermelondb/DatabaseProvider';

import { schema } from './schema';
import { migrations } from './migrations';
import { modelClasses } from './models';

// Create appropriate adapter for Web vs Native
let adapter: any;

if (Platform.OS === 'web') {
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error: any) => {
      console.error('Web Database setup error', error);
    },
  });
} else {
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: true,
    onSetUpError: (error: any) => {
      console.error('Database setup error', error);
    },
  });
}

// Initialize the database singleton
export const database = new Database({
  adapter,
  modelClasses,
});

const DatabaseContext = createContext<Database>(database);

export const useDatabase = () => {
  return useContext(DatabaseContext);
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Safety fallback timer to prevent blank screen
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 800);

    const seedInitialData = async () => {
      try {
        const budgetCategories = await database.get('budget_categories').query().fetch();
        
        if (budgetCategories.length === 0) {
          await database.write(async () => {
            const categories = [
              { name: 'Food', iconName: 'restaurant', color: '#FF6347' },
              { name: 'Transport', iconName: 'car', color: '#4682B4' },
              { name: 'Utilities', iconName: 'flash', color: '#FFD700' },
              { name: 'Rent', iconName: 'home', color: '#8A2BE2' },
              { name: 'Healthcare', iconName: 'medkit', color: '#32CD32' },
              { name: 'Entertainment', iconName: 'film', color: '#FF69B4' },
              { name: 'Education', iconName: 'book', color: '#00CED1' },
              { name: 'Other', iconName: 'ellipsis-horizontal', color: '#A9A9A9' },
            ];

            for (const cat of categories) {
              await database.get('budget_categories').create((category: any) => {
                category.name = cat.name;
                category.iconName = cat.iconName;
                category.color = cat.color;
                category.monthlyLimit = 0;
                category.isActive = true;
              });
            }
          });
        }
      } catch (error) {
        console.error('Error seeding initial data', error);
      } finally {
        setIsReady(true);
        clearTimeout(timer);
      }
    };

    seedInitialData();

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#080B14',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: '#00E5B3', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>
          Money-Honey
        </Text>
        <Text style={{ color: '#8892A4', fontSize: 13, marginTop: 8 }}>
          Loading your financial vault...
        </Text>
      </View>
    );
  }

  return (
    <DatabaseProviderWMDB database={database}>
      <DatabaseContext.Provider value={database}>
        {children}
      </DatabaseContext.Provider>
    </DatabaseProviderWMDB>
  );
};
