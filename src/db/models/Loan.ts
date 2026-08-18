import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import Account from './Account';

export default class Loan extends Model {
  static table = 'loans';

  @field('title') title!: string;
  @field('bank_name') bankName!: string;
  @field('loan_account_number') loanAccountNumber!: string;
  @field('disbursed_amount') disbursedAmount!: number;
  @field('outstanding_principal') outstandingPrincipal!: number;
  @field('annual_interest_rate') annualInterestRate!: number;
  @field('tenor_months') tenorMonths!: number;
  @field('emi_amount') emiAmount!: number;
  
  @date('start_date') startDate!: Date;
  @date('next_due_date') nextDueDate!: Date;
  
  @relation('accounts', 'linked_account_id') linkedAccount!: Account;
  
  @field('status') status!: 'active' | 'closed' | 'overdue';
  @field('loan_type') loanType!: 'home' | 'auto' | 'personal' | 'other';
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('loan_payments') loanPayments!: any;
}
