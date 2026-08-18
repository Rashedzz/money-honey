import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class BudgetCategory extends Model {
  static table = 'budget_categories';

  @field('name') name!: string;
  @field('icon_name') iconName!: string;
  @field('color') color!: string;
  @field('monthly_limit') monthlyLimit!: number;
  @field('is_active') isActive!: boolean;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
