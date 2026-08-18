import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import Account from './Account';

export default class FDR extends Model {
  static table = 'fdrs';

  @field('fdr_number') fdrNumber!: string;
  @field('bank_name') bankName!: string;
  @relation('accounts', 'linked_account_id') linkedAccount!: Account;
  
  @field('principal_amount') principalAmount!: number;
  @field('tenor_months') tenorMonths!: number;
  @field('annual_interest_rate') annualInterestRate!: number;
  @field('source_tax_percent') sourceTaxPercent!: number;
  @field('payout_frequency') payoutFrequency!: 'monthly' | 'at_maturity';
  
  @date('start_date') startDate!: Date;
  @date('maturity_date') maturityDate!: Date;
  
  @field('net_monthly_return') netMonthlyReturn!: number;
  @field('projected_maturity_value') projectedMaturityValue!: number;
  @field('status') status!: 'active' | 'matured' | 'withdrawn';
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('fdr_disbursements') fdrDisbursements!: any;
}
