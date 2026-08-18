import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

export interface IAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  accountType: 'savings' | 'current' | 'salary' | 'mfs' | 'cash';
  openingBalance: number;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  iconName?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default class Account extends Model implements IAccount {
  static table = 'accounts';

  @field('bank_name') bankName!: string;
  @field('account_name') accountName!: string;
  @field('account_number') accountNumber!: string;
  @field('branch') branch?: string;
  @field('account_type') accountType!: 'savings' | 'current' | 'salary' | 'mfs' | 'cash';
  @field('opening_balance') openingBalance!: number;
  @field('current_balance') currentBalance!: number;
  @field('currency') currency!: string;
  @field('is_active') isActive!: boolean;
  @field('icon_name') iconName?: string;
  @field('color') color?: string;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('transactions') transactions!: any;
}
