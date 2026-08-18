import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import FDR from './FDR';

export default class FDRDisbursement extends Model {
  static table = 'fdr_disbursements';

  @relation('fdrs', 'fdr_id') fdr!: FDR;
  
  @date('disbursement_date') disbursementDate!: Date;
  @field('gross_amount') grossAmount!: number;
  @field('tax_deducted') taxDeducted!: number;
  @field('net_amount') netAmount!: number;
  @field('is_credited') isCredited!: boolean;
  @field('linked_transaction_id') linkedTransactionId?: string;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
