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

    const sub = observable.subscribe((data: any[]) => {
      setLoans(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        bank_name: d.bank_name,
        principal: d.principal,
        interest_rate: d.interest_rate,
        is_active: d.is_active
      })));
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, [database]);

  const addLoan = async (data: any): Promise<void> => {
    await database.write(async () => {
      const loan = await database.collections.get('loans').create((record: any) => {
        record.title = data.title;
        record.bank_name = data.bank_name;
        record.principal = data.principal;
        record.interest_rate = data.interest_rate;
        record.is_active = true;
      });
      
      // Stub: Generate amortization schedule into loan_payments table
      // and schedule notifications...
    });
  };

  const markEMIPaid = async (loanPaymentId: string, actualPaymentDate: Date): Promise<void> => {
    await database.write(async () => {
      const payment = await database.collections.get('loan_payments').find(loanPaymentId);
      await payment.update((record: any) => {
        record.is_paid = true;
        record.payment_date = actualPaymentDate.getTime();
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

    return payments.map((p: any) => ({
      id: p.id,
      loan_id: p.loan_id,
      due_date: p.due_date,
      amount: p.amount,
      is_paid: p.is_paid
    }));
  };

  return { loans, upcomingEMIs, addLoan, markEMIPaid, getUpcomingEMIs, isLoading };
}
