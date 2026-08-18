import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import Account from './Account';

export default class Sanchaypatra extends Model {
  static table = 'sanchaypatra';

  @field('certificate_number') certificateNumber!: string;
  @field('sanchaypatra_type') sanchaypatraType!: 'five_year' | 'three_month_profit' | 'family_savings' | 'pensioner';
  @field('investment_amount') investmentAmount!: number;
  @date('issue_date') issueDate!: Date;
  @date('maturity_date') maturityDate!: Date;
  @field('annual_interest_rate') annualInterestRate!: number;
  @field('source_tax_percent') sourceTaxPercent!: number;
  @field('profit_interval') profitInterval!: 'monthly' | 'three_monthly' | 'at_maturity';
  
  @relation('accounts', 'linked_account_id') linkedAccount!: Account;
  
  @field('net_profit_per_interval') netProfitPerInterval!: number;
  @field('projected_maturity_value') projectedMaturityValue!: number;
  @field('status') status!: 'active' | 'matured' | 'withdrawn';
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('sanchaypatra_coupons') sanchaypatraCoupons!: any;
}
