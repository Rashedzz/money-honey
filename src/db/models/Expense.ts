import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import BudgetCategory from './BudgetCategory';
import Account from './Account';

export default class Expense extends Model {
  static table = 'expenses';

  @relation('budget_categories', 'category_id') category!: BudgetCategory;
  @relation('accounts', 'account_id') account!: Account;
  
  @field('amount') amount!: number;
  @field('description') description!: string;
  @date('expense_date') expenseDate!: Date;
  @field('is_recurring') isRecurring!: boolean;
  @field('recurrence_rule') recurrenceRule?: string;
  @field('linked_transaction_id') linkedTransactionId?: string;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
