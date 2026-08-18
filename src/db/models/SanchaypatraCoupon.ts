import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Sanchaypatra from './Sanchaypatra';

export default class SanchaypatraCoupon extends Model {
  static table = 'sanchaypatra_coupons';

  @relation('sanchaypatra', 'sanchaypatra_id') sanchaypatra!: Sanchaypatra;
  
  @date('coupon_date') couponDate!: Date;
  @field('gross_amount') grossAmount!: number;
  @field('tax_deducted') taxDeducted!: number;
  @field('net_amount') netAmount!: number;
  @field('is_collected') isCollected!: boolean;
  @field('linked_transaction_id') linkedTransactionId?: string;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
