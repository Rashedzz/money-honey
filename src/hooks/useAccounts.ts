import { useEffect, useState } from 'react';
import { useDatabase } from '../db/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

export interface IAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

export function useAccounts() {
  const database = useDatabase();
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accountsCollection = database.collections.get('accounts');
    const observable = accountsCollection.query(Q.where('is_active', true)).observe();
    
    const subscription = observable.subscribe((data: any[]) => {
      const formatted = data.map((record: any) => ({
        id: record.id,
        name: (record as any).name,
        type: (record as any).type,
        balance: (record as any).balance,
        is_active: (record as any).is_active,
      }));
      setAccounts(formatted);
      setTotalBalance(formatted.reduce((acc: number, curr: any) => acc + curr.balance, 0));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [database]);

  const addAccount = async (data: Partial<IAccount>): Promise<void> => {
    await database.write(async () => {
      const account = await database.collections.get('accounts').create((record: any) => {
        (record as any).name = data.name;
        (record as any).type = data.type || 'savings';
        (record as any).balance = data.balance || 0;
        (record as any).is_active = true;
      });

      if (data.balance && data.balance > 0) {
        await database.collections.get('transactions').create((record: any) => {
          (record as any).account_id = account.id;
          (record as any).amount = data.balance;
          (record as any).type = 'income';
          (record as any).description = 'Opening Balance';
          (record as any).date = new Date().getTime();
        });
      }
    });
  };

  const updateAccountBalance = async (accountId: string, newBalance: number, description: string): Promise<void> => {
    await database.write(async () => {
      const account = await database.collections.get('accounts').find(accountId);
      await account.update((record: any) => {
        (record as any).balance = newBalance;
      });
      // Optionally add a transaction for the adjustment here
    });
  };

  const deleteAccount = async (accountId: string): Promise<void> => {
    await database.write(async () => {
      const account = await database.collections.get('accounts').find(accountId);
      await account.update((record: any) => {
        (record as any).is_active = false;
      });
    });
  };

  return { accounts, totalBalance, isLoading, addAccount, updateAccountBalance, deleteAccount };
}
