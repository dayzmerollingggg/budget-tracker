export type FilingMode = 'individual' | 'joint';
export type JointViewMode = 'combined' | 'proportional';
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';
export type BonusFrequency = 'annual' | 'monthly';
export type DeductionUnit = 'percent' | 'dollar_per_paycheck';
export type DeductionTaxType = 'pre_tax' | 'post_tax';
export type ExpenseCategory = 'needs' | 'wants';

export interface IncomeStream {
  id: string;
  name: string;
  amount: number;
  frequency: BonusFrequency;
  isTaxable: boolean;
}

export interface PayrollDeduction {
  id: string;
  name: string;
  taxType: DeductionTaxType;
  unit: DeductionUnit;
  value: number;
  enabled: boolean;
  isRetirement?: boolean;
  isSection125?: boolean; // HSA, FSA, Health Insurance reduce FICA wages too
  employerMatchPercent?: number; // % of gross salary matched by employer
  isCustom?: boolean;
}

export interface PersonIncomeProfile {
  label: string;
  annualSalary: number;
  bonuses: IncomeStream[];
  deductions: PayrollDeduction[];
}

export interface TaxLocationConfig {
  stateCode: string;
  cityId: string;
  customLocalRate: number; // percentage, e.g. 1.5 means 1.5%
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  frequency: PayFrequency;
  category: ExpenseCategory;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  monthlyContribution: number;
}

export interface InvestmentBucket {
  id: 'hysa' | 'cd' | 'tbills' | 'index';
  name: string;
  shortName: string;
  allocationPercent: number;
  expectedApy: number;
  color: string;
}

export interface ProjectionSettings {
  horizonYears: number;
  adjustForInflation: boolean;
  inflationRate: number;
  startingInvestedBalance: number;
  startingRetirementBalance: number;
  fireModeEnabled: boolean;
  safeWithdrawalRate: number; // 3.0 to 5.0
  currentAge: number;
  coastTargetAge: number;
}

export interface PersonTaxBreakdown {
  grossSalary: number;
  taxableBonuses: number;
  taxFreeSubsidies: number;
  totalGrossEarned: number;
  preTax401kAnnual: number;
  preTaxSection125Annual: number;
  preTaxOtherAnnual: number;
  totalPreTaxDeductions: number;
  postTaxRetirementAnnual: number;
  postTaxOtherAnnual: number;
  totalPostTaxDeductions: number;
  employerMatchAnnual: number;
  socialSecurityTax: number;
  medicareTax: number;
  ficaTax: number;
}

export interface HouseholdTaxSummary {
  personA: PersonTaxBreakdown;
  personB: PersonTaxBreakdown | null;
  totalGrossIncome: number;
  totalTaxableBonuses: number;
  totalTaxFreeSubsidies: number;
  totalPreTaxDeductions: number;
  totalPostTaxDeductions: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  federalTaxableIncome: number;
  federalIncomeTax: number;
  stateIncomeTax: number;
  localIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  totalFicaTax: number;
  totalTaxes: number;
  effectiveTaxRate: number;
  marginalFederalRate: number;
  annualNetTakeHome: number;
  monthlyNetTakeHome: number;
  totalRetirementAnnual: number;
  totalEmployerMatchAnnual: number;
  personANetMonthly: number;
  personBNetMonthly: number;
  personAShareRatio: number;
  personBShareRatio: number;
}

export interface ProjectionDataPoint {
  year: number;
  age: number;
  totalPrincipal: number;
  compoundInterest: number;
  retirement401k: number;
  totalNetWorth: number;
  taxableBucketsTotal: number;
  fireTarget: number;
}
