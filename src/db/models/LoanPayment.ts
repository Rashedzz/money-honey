import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Loan from './Loan';

export default class LoanPayment extends Model {
  static table = 'loan_payments';

  @relation('loans', 'loan_id') loan!: Loan;
  
  @field('payment_number') paymentNumber!: number;
  @date('payment_date') paymentDate!: Date;
  @field('emi_amount') emiAmount!: number;
  @field('principal_component') principalComponent!: number;
  @field('interest_component') interestComponent!: number;
  @field('outstanding_principal_after') outstandingPrincipalAfter!: number;
  @field('status') status!: 'paid' | 'upcoming' | 'overdue';
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
