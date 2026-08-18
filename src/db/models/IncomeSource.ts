import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Account from './Account';

export default class IncomeSource extends Model {
  static table = 'income_sources';

  @field('name') name!: string;
  @field('source_type') sourceType!: 'salary' | 'business' | 'other';
  @field('amount') amount!: number;
  @field('frequency') frequency!: 'monthly' | 'one_time';
  @date('income_date') incomeDate!: Date;
  
  @relation('accounts', 'linked_account_id') linkedAccount?: Account;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
