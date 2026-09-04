import { useEffect, useState } from 'react';
import { useDatabase } from '../db/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

export interface IInvestment {
  id: string;
  type: 'fdr' | 'sanchaypatra';
  principal: number;
  maturity_date: number;
  is_active: boolean;
}

export function useInvestments() {
  const database = useDatabase();
  const [fdrs, setFdrs] = useState<IInvestment[]>([]);
  const [sanchaypatras, setSanchaypatras] = useState<IInvestment[]>([]);
  const [totalFDRValue, setTotalFDRValue] = useState(0);
  const [totalSanchaypatraValue, setTotalSanchaypatraValue] = useState(0);

  useEffect(() => {
    const invCollection = database.collections.get('investments');
    const observable = invCollection.query(Q.where('is_active', true)).observe();

    const sub = observable.subscribe((data: any[]) => {
      const activeInvestments: IInvestment[] = data.map((d: any) => ({
        id: d.id,
        type: d.type,
        principal: d.principal,
        maturity_date: d.maturity_date,
        is_active: d.is_active
      }));

      const activeFDRs = activeInvestments.filter((i: IInvestment) => i.type === 'fdr');
      const activeSPs = activeInvestments.filter((i: IInvestment) => i.type === 'sanchaypatra');

      setFdrs(activeFDRs);
      setSanchaypatras(activeSPs);
      setTotalFDRValue(activeFDRs.reduce((acc: number, curr: IInvestment) => acc + curr.principal, 0));
      setTotalSanchaypatraValue(activeSPs.reduce((acc: number, curr: IInvestment) => acc + curr.principal, 0));
    });

    return () => sub.unsubscribe();
  }, [database]);

  const addFDR = async (data: any): Promise<void> => {
    await database.write(async () => {
      await database.collections.get('investments').create((record: any) => {
        record.type = 'fdr';
        record.principal = data.principal;
        record.maturity_date = data.maturity_date;
        record.is_active = true;
      });
      // Generate disbursement schedule and schedule notifications...
    });
  };

  const addSanchaypatra = async (data: any): Promise<void> => {
    await database.write(async () => {
      await database.collections.get('investments').create((record: any) => {
        record.type = 'sanchaypatra';
        record.principal = data.principal;
        record.maturity_date = data.maturity_date;
        record.is_active = true;
      });
      // Generate coupon schedule and schedule notifications...
    });
  };

  return { fdrs, sanchaypatras, totalFDRValue, totalSanchaypatraValue, addFDR, addSanchaypatra };
}
