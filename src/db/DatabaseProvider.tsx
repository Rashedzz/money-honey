import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import DatabaseProviderWMDB from '@nozbe/watermelondb/DatabaseProvider';

import { schema } from './schema';
import { migrations } from './migrations';
import { modelClasses } from './models';

// Create SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Use JSI if available (improves performance)
  onSetUpError: (error) => {
    console.error('Database setup error', error);
  },
});

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
      }
    };

    seedInitialData();
  }, []);

  if (!isReady) {
    return null; // Or a loading spinner
  }

  return (
    <DatabaseProviderWMDB database={database}>
      <DatabaseContext.Provider value={database}>
        {children}
      </DatabaseContext.Provider>
    </DatabaseProviderWMDB>
  );
};
