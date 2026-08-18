import { useEffect, useState } from 'react';
import { useDatabase } from '../db/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

export interface ILoan {
  id: string;
  title: string;
  bank_name: string;
  principal: number;
  interest_rate: number;
  is_active: boolean;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  due_date: number;
  amount: number;
  is_paid: boolean;
}

export function useLoans() {
  const database = useDatabase();
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [upcomingEMIs, setUpcomingEMIs] = useState<LoanPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loansCollection = database.collections.get('loans');
    const observable = loansCollection.query(Q.where('is_active', true)).observe();

    const sub = observable.subscribe((data) => {
      setLoans(data.map(d => ({
        id: d.id,
        title: (d as any).title,
        bank_name: (d as any).bank_name,
        principal: (d as any).principal,
        interest_rate: (d as any).interest_rate,
        is_active: (d as any).is_active
      })));
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, [database]);

  const addLoan = async (data: any): Promise<void> => {
    await database.write(async () => {
      const loan = await database.collections.get('loans').create(record => {
        (record as any).title = data.title;
        (record as any).bank_name = data.bank_name;
        (record as any).principal = data.principal;
        (record as any).interest_rate = data.interest_rate;
        (record as any).is_active = true;
      });
      
      // Stub: Generate amortization schedule into loan_payments table
      // and schedule notifications...
    });
  };

  const markEMIPaid = async (loanPaymentId: string, actualPaymentDate: Date): Promise<void> => {
    await database.write(async () => {
      const payment = await database.collections.get('loan_payments').find(loanPaymentId);
      await payment.update(record => {
        (record as any).is_paid = true;
        (record as any).payment_date = actualPaymentDate.getTime();
      });
    });
  };

  const getUpcomingEMIs = async (daysAhead: number): Promise<LoanPayment[]> => {
    const now = new Date().getTime();
    const futureDate = now + (daysAhead * 24 * 60 * 60 * 1000);
    const payments = await database.collections.get('loan_payments').query(
      Q.where('is_paid', false),
      Q.where('due_date', Q.lte(futureDate))
    ).fetch();

    return payments.map(p => ({
      id: p.id,
      loan_id: (p as any).loan_id,
      due_date: (p as any).due_date,
      amount: (p as any).amount,
      is_paid: (p as any).is_paid
    }));
  };

  return { loans, upcomingEMIs, addLoan, markEMIPaid, getUpcomingEMIs, isLoading };
}
