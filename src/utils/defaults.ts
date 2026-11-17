import {
  ExpenseItem,
  InvestmentBucket,
  PayrollDeduction,
  PersonIncomeProfile,
  ProjectionSettings,
  SavingsGoal,
  TaxLocationConfig,
} from '../types/finance';

export const createDefaultDeductions = (): PayrollDeduction[] => [
  {
    id: 'ded-401k',
    name: '401(k) / 403(b)',
    taxType: 'pre_tax',
    unit: 'percent',
    value: 8,
    enabled: true,
    isRetirement: true,
    employerMatchPercent: 4,
  },
  {
    id: 'ded-hsa',
    name: 'HSA (Health Savings)',
    taxType: 'pre_tax',
    unit: 'dollar_per_paycheck',
    value: 100,
    enabled: true,
    isSection125: true,
  },
  {
    id: 'ded-fsa',
    name: 'FSA (Flexible Spending)',
    taxType: 'pre_tax',
    unit: 'dollar_per_paycheck',
    value: 0,
    enabled: false,
    isSection125: true,
  },
  {
    id: 'ded-health',
    name: 'Health / Dental / Vision',
    taxType: 'pre_tax',
    unit: 'dollar_per_paycheck',
    value: 95,
    enabled: true,
    isSection125: true,
  },
  {
    id: 'ded-roth401k',
    name: 'Roth 401(k)',
    taxType: 'post_tax',
    unit: 'percent',
    value: 0,
    enabled: false,
    isRetirement: true,
  },
  {
    id: 'ded-commuter',
    name: 'Commuter / Other Post-Tax',
    taxType: 'post_tax',
    unit: 'dollar_per_paycheck',
    value: 0,
    enabled: false,
  },
];

export const createBlankDeductions = (): PayrollDeduction[] =>
  createDefaultDeductions().map((d) => ({
    ...d,
    value: 0,
    enabled: false,
    employerMatchPercent: d.isRetirement && d.taxType === 'pre_tax' ? 0 : d.employerMatchPercent,
  }));

export const getSamplePersonA = (): PersonIncomeProfile => ({
  label: 'Person A',
  annualSalary: 98000,
  bonuses: [
    {
      id: 'bonus-a1',
      name: 'Annual Performance Bonus',
      amount: 6000,
      frequency: 'annual',
      isTaxable: true,
    },
  ],
  deductions: createDefaultDeductions(),
});

export const getSamplePersonB = (): PersonIncomeProfile => ({
  label: 'Person B',
  annualSalary: 76000,
  bonuses: [],
  deductions: createDefaultDeductions().map((d) =>
    d.id === 'ded-401k' ? { ...d, value: 6, employerMatchPercent: 3 } : d,
  ),
});

export const getBlankPerson = (label: string): PersonIncomeProfile => ({
  label,
  annualSalary: 0,
  bonuses: [],
  deductions: createBlankDeductions(),
});

export const getDefaultLocation = (): TaxLocationConfig => ({
  stateCode: 'CA',
  cityId: 'none',
  customLocalRate: 0,
});

export const getSampleExpenses = (): ExpenseItem[] => [
  { id: 'exp-1', name: 'Rent / Mortgage', amount: 2200, frequency: 'monthly', category: 'needs' },
  { id: 'exp-2', name: 'Groceries', amount: 150, frequency: 'weekly', category: 'needs' },
  { id: 'exp-3', name: 'Electric & Gas', amount: 165, frequency: 'monthly', category: 'needs' },
  { id: 'exp-4', name: 'Internet & Phone', amount: 130, frequency: 'monthly', category: 'needs' },
  { id: 'exp-5', name: 'Auto Insurance & Transit', amount: 220, frequency: 'monthly', category: 'needs' },
  { id: 'exp-6', name: 'Dining Out', amount: 340, frequency: 'monthly', category: 'wants' },
  { id: 'exp-7', name: 'Streaming & Subscriptions', amount: 65, frequency: 'monthly', category: 'wants' },
  { id: 'exp-8', name: 'Gym / Fitness', amount: 75, frequency: 'monthly', category: 'wants' },
];

export const getSampleGoals = (): SavingsGoal[] => [
  {
    id: 'goal-1',
    name: 'Emergency Fund Boost',
    targetAmount: 15000,
    monthlyContribution: 400,
  },
  {
    id: 'goal-2',
    name: 'Europe Trip',
    targetAmount: 5000,
    monthlyContribution: 250,
  },
];

export const getDefaultBuckets = (): InvestmentBucket[] => [
  {
    id: 'hysa',
    name: 'High-Yield Savings (HYSA)',
    shortName: 'HYSA',
    allocationPercent: 20,
    expectedApy: 4.2,
    color: '#0ea5e9',
  },
  {
    id: 'cd',
    name: 'Certificates of Deposit (CDs)',
    shortName: 'CDs',
    allocationPercent: 10,
    expectedApy: 4.5,
    color: '#6366f1',
  },
  {
    id: 'tbills',
    name: 'Treasury Bills / Bonds',
    shortName: 'T-Bills',
    allocationPercent: 10,
    expectedApy: 4.8,
    color: '#14b8a6',
  },
  {
    id: 'index',
    name: 'Index Funds / S&P 500',
    shortName: 'Index Funds',
    allocationPercent: 60,
    expectedApy: 8.5,
    color: '#059669',
  },
];

export const getSampleProjectionSettings = (): ProjectionSettings => ({
  horizonYears: 25,
  adjustForInflation: false,
  inflationRate: 2.5,
  startingInvestedBalance: 18000,
  startingRetirementBalance: 42000,
  fireModeEnabled: true,
  safeWithdrawalRate: 4.0,
  currentAge: 30,
  coastTargetAge: 65,
});

export const getBlankProjectionSettings = (): ProjectionSettings => ({
  horizonYears: 25,
  adjustForInflation: false,
  inflationRate: 2.5,
  startingInvestedBalance: 0,
  startingRetirementBalance: 0,
  fireModeEnabled: false,
  safeWithdrawalRate: 4.0,
  currentAge: 30,
  coastTargetAge: 65,
});
