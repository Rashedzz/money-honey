import React, { createContext, useContext, ReactNode } from 'react';
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { migrations } from './migrations';
import { modelClasses } from './models';

let databaseInstance: any = null;

const getWebDatabase = () => {
  if (databaseInstance) return databaseInstance;

  try {
    const adapter = new LokiJSAdapter({
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    });

    databaseInstance = new Database({
      adapter,
      modelClasses,
    });
  } catch (err) {
    console.warn('Web database fallback:', err);
    databaseInstance = {
      get: () => ({ query: () => ({ fetch: async () => [], observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }) }),
      write: async (cb: any) => cb(),
    };
  }

  return databaseInstance;
};

export const database = getWebDatabase();

const DatabaseContext = createContext<any>(database);

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};
