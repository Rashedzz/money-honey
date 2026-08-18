import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Account from './Account';

export default class Transaction extends Model {
  static table = 'transactions';

  @relation('accounts', 'account_id') account!: Account;
  
  @field('type') type!: 'credit' | 'debit';
  @field('amount') amount!: number;
  @field('description') description!: string;
  @field('category') category!: string;
  @field('source_type') sourceType!: 'manual' | 'sms' | 'auto_fdr' | 'auto_sanchaypatra' | 'auto_emi';
  @field('reference_id') referenceId?: string;
  @field('balance_after') balanceAfter!: number;
  
  @date('transaction_date') transactionDate!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
