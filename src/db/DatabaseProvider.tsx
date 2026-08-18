import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { schema } from './schema';
import { migrations } from './migrations';
import { modelClasses } from './models';

let databaseInstance: any = null;

const createDatabase = () => {
  if (databaseInstance) return databaseInstance;

  try {
    let adapter: any;

    if (Platform.OS === 'web') {
      const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
      adapter = new LokiJSAdapter({
        schema,
        migrations,
        useWebWorker: false,
        useIncrementalIndexedDB: false,
      });
    } else {
      const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
      adapter = new SQLiteAdapter({
        schema,
        migrations,
        jsi: true,
      });
    }

    databaseInstance = new Database({
      adapter,
      modelClasses,
    });
  } catch (err) {
    console.warn('Database initialization fallback:', err);
    databaseInstance = {
      get: () => ({ query: () => ({ fetch: async () => [], observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }) }),
      write: async (cb: any) => cb(),
    };
  }

  return databaseInstance;
};

export const database = createDatabase();

const DatabaseContext = createContext<any>(database);

export const useDatabase = () => {
  return useContext(DatabaseContext);
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};
