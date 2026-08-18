import Account from './Account';
import Transaction from './Transaction';
import Loan from './Loan';
import LoanPayment from './LoanPayment';
import FDR from './FDR';
import FDRDisbursement from './FDRDisbursement';
import Sanchaypatra from './Sanchaypatra';
import SanchaypatraCoupon from './SanchaypatraCoupon';
import BudgetCategory from './BudgetCategory';
import Expense from './Expense';
import IncomeSource from './IncomeSource';
import { Model } from '@nozbe/watermelondb';

// Basic sync metadata model
class SyncMetadata extends Model {
  static table = 'sync_metadata';
  // Just to satisfy the schema definition
}

export const modelClasses = [
  Account,
  Transaction,
  Loan,
  LoanPayment,
  FDR,
  FDRDisbursement,
  Sanchaypatra,
  SanchaypatraCoupon,
  BudgetCategory,
  Expense,
  IncomeSource,
  SyncMetadata,
];

export {
  Account,
  Transaction,
  Loan,
  LoanPayment,
  FDR,
  FDRDisbursement,
  Sanchaypatra,
  SanchaypatraCoupon,
  BudgetCategory,
  Expense,
  IncomeSource,
};
