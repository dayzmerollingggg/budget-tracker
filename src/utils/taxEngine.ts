import {
  FilingMode,
  HouseholdTaxSummary,
  PayrollDeduction,
  PersonIncomeProfile,
  PersonTaxBreakdown,
  TaxLocationConfig,
} from '../types/finance';

export interface TaxBracket {
  upTo: number;
  rate: number;
}

export interface StateTaxInfo {
  code: string;
  name: string;
  type: 'none' | 'flat' | 'progressive';
  singleBrackets: TaxBracket[];
  jointBrackets: TaxBracket[];
  singleDeduction: number;
  jointDeduction: number;
}

export interface CityLocalTaxOption {
  id: string;
  label: string;
  rate: number; // decimal, e.g. 0.03876
}

// 2026 Federal Standard Deductions
export const FEDERAL_STANDARD_DEDUCTION_2026 = {
  individual: 16100,
  joint: 32200,
} as const;

// 2026 Social Security Wage Base (projected) & Rates
export const SS_WAGE_BASE_2026 = 184500;
export const SS_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;
export const ADDITIONAL_MEDICARE_RATE = 0.009;
export const PAYCHECKS_PER_YEAR = 26;

// 2026 Federal Income Tax Brackets
export const FEDERAL_BRACKETS_2026: Record<FilingMode, TaxBracket[]> = {
  individual: [
    { upTo: 12400, rate: 0.10 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  joint: [
    { upTo: 24800, rate: 0.10 },
    { upTo: 100800, rate: 0.12 },
    { upTo: 211400, rate: 0.22 },
    { upTo: 403550, rate: 0.24 },
    { upTo: 512450, rate: 0.32 },
    { upTo: 768700, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

function flatState(code: string, name: string, rate: number, singleDed = 0, jointDed = 0): StateTaxInfo {
  return {
    code,
    name,
    type: rate === 0 ? 'none' : 'flat',
    singleBrackets: [{ upTo: Infinity, rate }],
    jointBrackets: [{ upTo: Infinity, rate }],
    singleDeduction: singleDed,
    jointDeduction: jointDed,
  };
}

function progState(
  code: string,
  name: string,
  singleBrackets: TaxBracket[],
  jointBrackets: TaxBracket[],
  singleDeduction = 0,
  jointDeduction = 0,
): StateTaxInfo {
  return {
    code,
    name,
    type: 'progressive',
    singleBrackets,
    jointBrackets,
    singleDeduction,
    jointDeduction,
  };
}

function scaleJoint(brackets: TaxBracket[]): TaxBracket[] {
  return brackets.map((b) => ({
    upTo: b.upTo === Infinity ? Infinity : b.upTo * 2,
    rate: b.rate,
  }));
}

// All 50 States + DC
export const US_STATES: StateTaxInfo[] = [
  progState('AL', 'Alabama', [{ upTo: 500, rate: 0.02 }, { upTo: 3000, rate: 0.04 }, { upTo: Infinity, rate: 0.05 }], [{ upTo: 1000, rate: 0.02 }, { upTo: 6000, rate: 0.04 }, { upTo: Infinity, rate: 0.05 }], 3000, 8500),
  flatState('AK', 'Alaska', 0),
  flatState('AZ', 'Arizona', 0.025, 14600, 29200),
  progState('AR', 'Arkansas', [{ upTo: 4500, rate: 0.02 }, { upTo: 9000, rate: 0.035 }, { upTo: Infinity, rate: 0.039 }], scaleJoint([{ upTo: 4500, rate: 0.02 }, { upTo: 9000, rate: 0.035 }, { upTo: Infinity, rate: 0.039 }]), 2410, 4820),
  progState(
    'CA',
    'California',
    [
      { upTo: 10756, rate: 0.01 },
      { upTo: 25499, rate: 0.02 },
      { upTo: 40245, rate: 0.04 },
      { upTo: 55866, rate: 0.06 },
      { upTo: 70606, rate: 0.08 },
      { upTo: 360659, rate: 0.093 },
      { upTo: 432787, rate: 0.103 },
      { upTo: 721314, rate: 0.113 },
      { upTo: 1000000, rate: 0.123 },
      { upTo: Infinity, rate: 0.133 },
    ],
    scaleJoint([
      { upTo: 10756, rate: 0.01 },
      { upTo: 25499, rate: 0.02 },
      { upTo: 40245, rate: 0.04 },
      { upTo: 55866, rate: 0.06 },
      { upTo: 70606, rate: 0.08 },
      { upTo: 360659, rate: 0.093 },
      { upTo: 432787, rate: 0.103 },
      { upTo: 721314, rate: 0.113 },
      { upTo: Infinity, rate: 0.123 },
    ]),
    5540,
    11080,
  ),
  flatState('CO', 'Colorado', 0.044, 15000, 30000),
  progState('CT', 'Connecticut', [{ upTo: 10000, rate: 0.02 }, { upTo: 50000, rate: 0.045 }, { upTo: 100000, rate: 0.055 }, { upTo: 200000, rate: 0.06 }, { upTo: 250000, rate: 0.065 }, { upTo: 500000, rate: 0.069 }, { upTo: Infinity, rate: 0.0699 }], scaleJoint([{ upTo: 10000, rate: 0.02 }, { upTo: 50000, rate: 0.045 }, { upTo: 100000, rate: 0.055 }, { upTo: 200000, rate: 0.06 }, { upTo: 250000, rate: 0.065 }, { upTo: 500000, rate: 0.069 }, { upTo: Infinity, rate: 0.0699 }]), 0, 0),
  progState('DE', 'Delaware', [{ upTo: 2000, rate: 0 }, { upTo: 5000, rate: 0.022 }, { upTo: 10000, rate: 0.039 }, { upTo: 20000, rate: 0.048 }, { upTo: 25000, rate: 0.052 }, { upTo: 60000, rate: 0.0555 }, { upTo: Infinity, rate: 0.066 }], [{ upTo: 2000, rate: 0 }, { upTo: 5000, rate: 0.022 }, { upTo: 10000, rate: 0.039 }, { upTo: 20000, rate: 0.048 }, { upTo: 25000, rate: 0.052 }, { upTo: 60000, rate: 0.0555 }, { upTo: Infinity, rate: 0.066 }], 3250, 6500),
  progState('DC', 'District of Columbia', [{ upTo: 10000, rate: 0.04 }, { upTo: 40000, rate: 0.06 }, { upTo: 60000, rate: 0.065 }, { upTo: 250000, rate: 0.085 }, { upTo: 500000, rate: 0.0925 }, { upTo: 1000000, rate: 0.0975 }, { upTo: Infinity, rate: 0.1075 }], [{ upTo: 10000, rate: 0.04 }, { upTo: 40000, rate: 0.06 }, { upTo: 60000, rate: 0.065 }, { upTo: 250000, rate: 0.085 }, { upTo: 500000, rate: 0.0925 }, { upTo: 1000000, rate: 0.0975 }, { upTo: Infinity, rate: 0.1075 }], 15000, 30000),
  flatState('FL', 'Florida', 0),
  flatState('GA', 'Georgia', 0.0519, 12000, 24000),
  progState('HI', 'Hawaii', [{ upTo: 2400, rate: 0.014 }, { upTo: 4800, rate: 0.032 }, { upTo: 9600, rate: 0.055 }, { upTo: 14400, rate: 0.064 }, { upTo: 19200, rate: 0.068 }, { upTo: 24000, rate: 0.072 }, { upTo: 36000, rate: 0.076 }, { upTo: 48000, rate: 0.079 }, { upTo: 150000, rate: 0.0825 }, { upTo: 175000, rate: 0.09 }, { upTo: 200000, rate: 0.10 }, { upTo: Infinity, rate: 0.11 }], scaleJoint([{ upTo: 2400, rate: 0.014 }, { upTo: 4800, rate: 0.032 }, { upTo: 9600, rate: 0.055 }, { upTo: 14400, rate: 0.064 }, { upTo: 19200, rate: 0.068 }, { upTo: 24000, rate: 0.072 }, { upTo: 36000, rate: 0.076 }, { upTo: 48000, rate: 0.079 }, { upTo: 150000, rate: 0.0825 }, { upTo: 175000, rate: 0.09 }, { upTo: 200000, rate: 0.10 }, { upTo: Infinity, rate: 0.11 }]), 4400, 8800),
  flatState('ID', 'Idaho', 0.05695, 15000, 30000),
  flatState('IL', 'Illinois', 0.0495, 2775, 5550),
  flatState('IN', 'Indiana', 0.0295, 1000, 2000),
  flatState('IA', 'Iowa', 0.038, 0, 0),
  progState('KS', 'Kansas', [{ upTo: 23000, rate: 0.052 }, { upTo: Infinity, rate: 0.0558 }], [{ upTo: 46000, rate: 0.052 }, { upTo: Infinity, rate: 0.0558 }], 3500, 8000),
  flatState('KY', 'Kentucky', 0.04, 3270, 6540),
  flatState('LA', 'Louisiana', 0.03, 12500, 25000),
  progState('ME', 'Maine', [{ upTo: 26050, rate: 0.058 }, { upTo: 61600, rate: 0.0675 }, { upTo: Infinity, rate: 0.0715 }], scaleJoint([{ upTo: 26050, rate: 0.058 }, { upTo: 61600, rate: 0.0675 }, { upTo: Infinity, rate: 0.0715 }]), 15000, 30000),
  progState('MD', 'Maryland', [{ upTo: 1000, rate: 0.02 }, { upTo: 2000, rate: 0.03 }, { upTo: 3000, rate: 0.04 }, { upTo: 100000, rate: 0.0475 }, { upTo: 125000, rate: 0.05 }, { upTo: 150000, rate: 0.0525 }, { upTo: 250000, rate: 0.055 }, { upTo: Infinity, rate: 0.0575 }], [{ upTo: 1000, rate: 0.02 }, { upTo: 2000, rate: 0.03 }, { upTo: 3000, rate: 0.04 }, { upTo: 150000, rate: 0.0475 }, { upTo: 175000, rate: 0.05 }, { upTo: 225000, rate: 0.0525 }, { upTo: 300000, rate: 0.055 }, { upTo: Infinity, rate: 0.0575 }], 2700, 5450),
  progState('MA', 'Massachusetts', [{ upTo: 1083150, rate: 0.05 }, { upTo: Infinity, rate: 0.09 }], [{ upTo: 1083150, rate: 0.05 }, { upTo: Infinity, rate: 0.09 }], 4400, 8800),
  flatState('MI', 'Michigan', 0.0425, 5600, 11200),
  progState('MN', 'Minnesota', [{ upTo: 32570, rate: 0.0535 }, { upTo: 106990, rate: 0.068 }, { upTo: 198630, rate: 0.0785 }, { upTo: Infinity, rate: 0.0985 }], [{ upTo: 47620, rate: 0.0535 }, { upTo: 189180, rate: 0.068 }, { upTo: 330410, rate: 0.0785 }, { upTo: Infinity, rate: 0.0985 }], 14950, 29900),
  flatState('MS', 'Mississippi', 0.044, 12300, 14600),
  progState('MO', 'Missouri', [{ upTo: 1313, rate: 0 }, { upTo: 2626, rate: 0.02 }, { upTo: 3939, rate: 0.025 }, { upTo: 5252, rate: 0.03 }, { upTo: 6565, rate: 0.035 }, { upTo: 7878, rate: 0.04 }, { upTo: 9191, rate: 0.045 }, { upTo: Infinity, rate: 0.047 }], [{ upTo: 1313, rate: 0 }, { upTo: 2626, rate: 0.02 }, { upTo: 3939, rate: 0.025 }, { upTo: 5252, rate: 0.03 }, { upTo: 6565, rate: 0.035 }, { upTo: 7878, rate: 0.04 }, { upTo: 9191, rate: 0.045 }, { upTo: Infinity, rate: 0.047 }], 15000, 30000),
  progState('MT', 'Montana', [{ upTo: 21100, rate: 0.047 }, { upTo: Infinity, rate: 0.059 }], [{ upTo: 42200, rate: 0.047 }, { upTo: Infinity, rate: 0.059 }], 15000, 30000),
  progState('NE', 'Nebraska', [{ upTo: 3820, rate: 0.0246 }, { upTo: 22920, rate: 0.0351 }, { upTo: 37060, rate: 0.0501 }, { upTo: Infinity, rate: 0.052 }], scaleJoint([{ upTo: 3820, rate: 0.0246 }, { upTo: 22920, rate: 0.0351 }, { upTo: 37060, rate: 0.0501 }, { upTo: Infinity, rate: 0.052 }]), 8350, 16700),
  flatState('NV', 'Nevada', 0),
  flatState('NH', 'New Hampshire', 0),
  progState('NJ', 'New Jersey', [{ upTo: 20000, rate: 0.014 }, { upTo: 35000, rate: 0.0175 }, { upTo: 40000, rate: 0.035 }, { upTo: 75000, rate: 0.05525 }, { upTo: 500000, rate: 0.0637 }, { upTo: 1000000, rate: 0.0897 }, { upTo: Infinity, rate: 0.1075 }], [{ upTo: 20000, rate: 0.014 }, { upTo: 50000, rate: 0.0175 }, { upTo: 70000, rate: 0.0245 }, { upTo: 80000, rate: 0.035 }, { upTo: 150000, rate: 0.05525 }, { upTo: 500000, rate: 0.0637 }, { upTo: 1000000, rate: 0.0897 }, { upTo: Infinity, rate: 0.1075 }], 1000, 2000),
  progState('NM', 'New Mexico', [{ upTo: 5500, rate: 0.017 }, { upTo: 11000, rate: 0.032 }, { upTo: 16000, rate: 0.047 }, { upTo: 210000, rate: 0.049 }, { upTo: Infinity, rate: 0.059 }], scaleJoint([{ upTo: 5500, rate: 0.017 }, { upTo: 11000, rate: 0.032 }, { upTo: 16000, rate: 0.047 }, { upTo: 210000, rate: 0.049 }, { upTo: Infinity, rate: 0.059 }]), 15000, 30000),
  progState(
    'NY',
    'New York',
    [
      { upTo: 8500, rate: 0.04 },
      { upTo: 11700, rate: 0.045 },
      { upTo: 13900, rate: 0.0525 },
      { upTo: 80650, rate: 0.055 },
      { upTo: 215400, rate: 0.06 },
      { upTo: 1077550, rate: 0.0685 },
      { upTo: 5000000, rate: 0.0965 },
      { upTo: 25000000, rate: 0.103 },
      { upTo: Infinity, rate: 0.109 },
    ],
    [
      { upTo: 17150, rate: 0.04 },
      { upTo: 23600, rate: 0.045 },
      { upTo: 27900, rate: 0.0525 },
      { upTo: 161550, rate: 0.055 },
      { upTo: 323200, rate: 0.06 },
      { upTo: 2155350, rate: 0.0685 },
      { upTo: 5000000, rate: 0.0965 },
      { upTo: 25000000, rate: 0.103 },
      { upTo: Infinity, rate: 0.109 },
    ],
    8000,
    16050,
  ),
  flatState('NC', 'North Carolina', 0.0399, 12750, 25500),
  progState('ND', 'North Dakota', [{ upTo: 47150, rate: 0 }, { upTo: 237600, rate: 0.0195 }, { upTo: Infinity, rate: 0.025 }], [{ upTo: 78800, rate: 0 }, { upTo: 289000, rate: 0.0195 }, { upTo: Infinity, rate: 0.025 }], 15000, 30000),
  progState('OH', 'Ohio', [{ upTo: 26050, rate: 0 }, { upTo: 100000, rate: 0.0275 }, { upTo: Infinity, rate: 0.035 }], [{ upTo: 26050, rate: 0 }, { upTo: 100000, rate: 0.0275 }, { upTo: Infinity, rate: 0.035 }], 2400, 4800),
  progState('OK', 'Oklahoma', [{ upTo: 1000, rate: 0.0025 }, { upTo: 2500, rate: 0.0075 }, { upTo: 3750, rate: 0.0175 }, { upTo: 4900, rate: 0.0275 }, { upTo: 7200, rate: 0.0375 }, { upTo: Infinity, rate: 0.0475 }], scaleJoint([{ upTo: 1000, rate: 0.0025 }, { upTo: 2500, rate: 0.0075 }, { upTo: 3750, rate: 0.0175 }, { upTo: 4900, rate: 0.0275 }, { upTo: 7200, rate: 0.0375 }, { upTo: Infinity, rate: 0.0475 }]), 6350, 12700),
  progState('OR', 'Oregon', [{ upTo: 4400, rate: 0.0475 }, { upTo: 11050, rate: 0.0675 }, { upTo: 125000, rate: 0.0875 }, { upTo: Infinity, rate: 0.099 }], scaleJoint([{ upTo: 4400, rate: 0.0475 }, { upTo: 11050, rate: 0.0675 }, { upTo: 125000, rate: 0.0875 }, { upTo: Infinity, rate: 0.099 }]), 2745, 5495),
  flatState('PA', 'Pennsylvania', 0.0307, 0, 0),
  progState('RI', 'Rhode Island', [{ upTo: 77450, rate: 0.0375 }, { upTo: 176050, rate: 0.0475 }, { upTo: Infinity, rate: 0.0599 }], [{ upTo: 77450, rate: 0.0375 }, { upTo: 176050, rate: 0.0475 }, { upTo: Infinity, rate: 0.0599 }], 10900, 21800),
  progState('SC', 'South Carolina', [{ upTo: 3460, rate: 0 }, { upTo: 17330, rate: 0.03 }, { upTo: Infinity, rate: 0.062 }], [{ upTo: 3460, rate: 0 }, { upTo: 17330, rate: 0.03 }, { upTo: Infinity, rate: 0.062 }], 15000, 30000),
  flatState('SD', 'South Dakota', 0),
  flatState('TN', 'Tennessee', 0),
  flatState('TX', 'Texas', 0),
  flatState('UT', 'Utah', 0.0455, 0, 0),
  progState('VT', 'Vermont', [{ upTo: 47900, rate: 0.0335 }, { upTo: 116000, rate: 0.066 }, { upTo: 242000, rate: 0.076 }, { upTo: Infinity, rate: 0.0875 }], [{ upTo: 79950, rate: 0.0335 }, { upTo: 193300, rate: 0.066 }, { upTo: 294600, rate: 0.076 }, { upTo: Infinity, rate: 0.0875 }], 7400, 14800),
  progState('VA', 'Virginia', [{ upTo: 3000, rate: 0.02 }, { upTo: 5000, rate: 0.03 }, { upTo: 17000, rate: 0.05 }, { upTo: Infinity, rate: 0.0575 }], [{ upTo: 3000, rate: 0.02 }, { upTo: 5000, rate: 0.03 }, { upTo: 17000, rate: 0.05 }, { upTo: Infinity, rate: 0.0575 }], 8500, 17000),
  flatState('WA', 'Washington', 0),
  progState('WV', 'West Virginia', [{ upTo: 10000, rate: 0.0222 }, { upTo: 25000, rate: 0.0296 }, { upTo: 40000, rate: 0.0333 }, { upTo: 60000, rate: 0.0444 }, { upTo: Infinity, rate: 0.0482 }], [{ upTo: 10000, rate: 0.0222 }, { upTo: 25000, rate: 0.0296 }, { upTo: 40000, rate: 0.0333 }, { upTo: 60000, rate: 0.0444 }, { upTo: Infinity, rate: 0.0482 }], 2000, 4000),
  progState('WI', 'Wisconsin', [{ upTo: 14320, rate: 0.035 }, { upTo: 28640, rate: 0.044 }, { upTo: 315310, rate: 0.053 }, { upTo: Infinity, rate: 0.0765 }], [{ upTo: 19090, rate: 0.035 }, { upTo: 38190, rate: 0.044 }, { upTo: 420420, rate: 0.053 }, { upTo: Infinity, rate: 0.0765 }], 13230, 24490),
  flatState('WY', 'Wyoming', 0),
];

export const CITY_LOCAL_TAX_OPTIONS: CityLocalTaxOption[] = [
  { id: 'none', label: 'None / Standard City (0.00%)', rate: 0 },
  { id: 'nyc', label: 'New York City, NY (3.88%)', rate: 0.03876 },
  { id: 'phl', label: 'Philadelphia, PA (3.75%)', rate: 0.0375 },
  { id: 'bal', label: 'Baltimore, MD (3.20%)', rate: 0.032 },
  { id: 'pit', label: 'Pittsburgh, PA (3.00%)', rate: 0.03 },
  { id: 'cmh', label: 'Columbus, OH (2.50%)', rate: 0.025 },
  { id: 'cle', label: 'Cleveland, OH (2.50%)', rate: 0.025 },
  { id: 'det', label: 'Detroit, MI (2.40%)', rate: 0.024 },
  { id: 'sdf', label: 'Louisville, KY (2.20%)', rate: 0.022 },
  { id: 'cin', label: 'Cincinnati, OH (1.80%)', rate: 0.018 },
  { id: 'sf', label: 'San Francisco, CA (1.20% CA SDI / Local)', rate: 0.012 },
  { id: 'pdx', label: 'Portland Metro, OR (1.00%)', rate: 0.01 },
  { id: 'mci', label: 'Kansas City, MO (1.00%)', rate: 0.01 },
  { id: 'stl', label: 'St. Louis, MO (1.00%)', rate: 0.01 },
  { id: 'yon', label: 'Yonkers, NY (0.65%)', rate: 0.0065 },
  { id: 'custom', label: 'Custom Local Tax Rate (%)', rate: 0 },
];

export function computeProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[],
): { tax: number; marginalRate: number } {
  if (taxableIncome <= 0) {
    return { tax: 0, marginalRate: brackets[0]?.rate ?? 0 };
  }

  let tax = 0;
  let prevCap = 0;
  let marginalRate = brackets[0]?.rate ?? 0;

  for (const bracket of brackets) {
    if (taxableIncome <= prevCap) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.upTo) - prevCap;
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
      marginalRate = bracket.rate;
    }
    prevCap = bracket.upTo;
  }

  return { tax, marginalRate };
}

function getAnnualDeductionAmount(deduction: PayrollDeduction, grossSalary: number): number {
  if (!deduction.enabled || deduction.value <= 0) return 0;
  if (deduction.unit === 'percent') {
    return grossSalary * (deduction.value / 100);
  }
  return deduction.value * PAYCHECKS_PER_YEAR;
}

export function calculatePersonBreakdown(
  profile: PersonIncomeProfile,
  filingMode: FilingMode,
): PersonTaxBreakdown {
  const grossSalary = Math.max(0, profile.annualSalary);

  let taxableBonuses = 0;
  let taxFreeSubsidies = 0;
  for (const b of profile.bonuses) {
    const annualAmt = b.frequency === 'annual' ? Math.max(0, b.amount) : Math.max(0, b.amount) * 12;
    if (b.isTaxable) {
      taxableBonuses += annualAmt;
    } else {
      taxFreeSubsidies += annualAmt;
    }
  }

  const totalGrossEarned = grossSalary + taxableBonuses;

  let preTax401kAnnual = 0;
  let preTaxSection125Annual = 0;
  let preTaxOtherAnnual = 0;
  let postTaxRetirementAnnual = 0;
  let postTaxOtherAnnual = 0;
  let employerMatchAnnual = 0;

  for (const d of profile.deductions) {
    const amt = getAnnualDeductionAmount(d, grossSalary);
    if (d.taxType === 'pre_tax') {
      if (d.isRetirement) {
        preTax401kAnnual += amt;
        if (d.enabled && d.employerMatchPercent && d.employerMatchPercent > 0) {
          employerMatchAnnual += grossSalary * (d.employerMatchPercent / 100);
        }
      } else if (d.isSection125) {
        preTaxSection125Annual += amt;
      } else {
        preTaxOtherAnnual += amt;
      }
    } else {
      if (d.isRetirement) {
        postTaxRetirementAnnual += amt;
      } else {
        postTaxOtherAnnual += amt;
      }
    }
  }

  // Cap pre-tax deductions at total gross earned
  const rawPreTax = preTax401kAnnual + preTaxSection125Annual + preTaxOtherAnnual;
  const totalPreTaxDeductions = Math.min(totalGrossEarned, rawPreTax);
  const totalPostTaxDeductions = postTaxRetirementAnnual + postTaxOtherAnnual;

  // FICA wages exclude Section 125 deductions (HSA/FSA/Health), but include 401(k)
  const ficaWages = Math.max(0, totalGrossEarned - Math.min(totalGrossEarned, preTaxSection125Annual));
  const socialSecurityTax = Math.min(ficaWages, SS_WAGE_BASE_2026) * SS_RATE;
  const individualMedicareThreshold = filingMode === 'individual' ? 200000 : 250000;
  const medicareTax =
    ficaWages * MEDICARE_RATE +
    (filingMode === 'individual'
      ? Math.max(0, ficaWages - individualMedicareThreshold) * ADDITIONAL_MEDICARE_RATE
      : 0);

  return {
    grossSalary,
    taxableBonuses,
    taxFreeSubsidies,
    totalGrossEarned,
    preTax401kAnnual,
    preTaxSection125Annual,
    preTaxOtherAnnual,
    totalPreTaxDeductions,
    postTaxRetirementAnnual,
    postTaxOtherAnnual,
    totalPostTaxDeductions,
    employerMatchAnnual,
    socialSecurityTax,
    medicareTax,
    ficaTax: socialSecurityTax + medicareTax,
  };
}

export function calculateHouseholdTaxes(
  filingMode: FilingMode,
  personAProfile: PersonIncomeProfile,
  personBProfile: PersonIncomeProfile,
  location: TaxLocationConfig,
): HouseholdTaxSummary {
  const personA = calculatePersonBreakdown(personAProfile, filingMode);
  const personB = filingMode === 'joint' ? calculatePersonBreakdown(personBProfile, filingMode) : null;

  const totalGrossIncome = personA.totalGrossEarned + (personB?.totalGrossEarned ?? 0);
  const totalTaxableBonuses = personA.taxableBonuses + (personB?.taxableBonuses ?? 0);
  const totalTaxFreeSubsidies = personA.taxFreeSubsidies + (personB?.taxFreeSubsidies ?? 0);
  const totalPreTaxDeductions = personA.totalPreTaxDeductions + (personB?.totalPreTaxDeductions ?? 0);
  const totalPostTaxDeductions = personA.totalPostTaxDeductions + (personB?.totalPostTaxDeductions ?? 0);

  const adjustedGrossIncome = Math.max(0, totalGrossIncome - totalPreTaxDeductions);
  const standardDeduction = FEDERAL_STANDARD_DEDUCTION_2026[filingMode];
  const federalTaxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);

  const fedResult = computeProgressiveTax(federalTaxableIncome, FEDERAL_BRACKETS_2026[filingMode]);
  const federalIncomeTax = fedResult.tax;

  const stateInfo = US_STATES.find((s) => s.code === location.stateCode) ?? US_STATES[0];
  const stateDed = filingMode === 'joint' ? stateInfo.jointDeduction : stateInfo.singleDeduction;
  const stateTaxable = Math.max(0, adjustedGrossIncome - stateDed);
  const stateBrackets = filingMode === 'joint' ? stateInfo.jointBrackets : stateInfo.singleBrackets;
  const stateIncomeTax = computeProgressiveTax(stateTaxable, stateBrackets).tax;

  const cityOption = CITY_LOCAL_TAX_OPTIONS.find((c) => c.id === location.cityId) ?? CITY_LOCAL_TAX_OPTIONS[0];
  const localRate =
    location.cityId === 'custom' ? Math.max(0, location.customLocalRate) / 100 : cityOption.rate;
  const localIncomeTax = adjustedGrossIncome * localRate;

  // Joint Additional Medicare Tax (0.9% over $250,000 combined FICA wages)
  const personAFicaWages = Math.max(0, personA.totalGrossEarned - personA.preTaxSection125Annual);
  const personBFicaWages = personB
    ? Math.max(0, personB.totalGrossEarned - personB.preTaxSection125Annual)
    : 0;

  const socialSecurityTax = personA.socialSecurityTax + (personB?.socialSecurityTax ?? 0);
  let medicareTax = personA.medicareTax + (personB?.medicareTax ?? 0);
  if (filingMode === 'joint') {
    const combinedFicaWages = personAFicaWages + personBFicaWages;
    const jointAddMedicare = Math.max(0, combinedFicaWages - 250000) * ADDITIONAL_MEDICARE_RATE;
    medicareTax += jointAddMedicare;
  }
  const totalFicaTax = socialSecurityTax + medicareTax;

  const totalTaxes = federalIncomeTax + stateIncomeTax + localIncomeTax + totalFicaTax;
  const totalCompensation = totalGrossIncome + totalTaxFreeSubsidies;
  const effectiveTaxRate = totalGrossIncome > 0 ? (totalTaxes / totalGrossIncome) * 100 : 0;

  const annualNetTakeHome = Math.max(
    0,
    totalCompensation - totalPreTaxDeductions - totalTaxes - totalPostTaxDeductions,
  );
  const monthlyNetTakeHome = annualNetTakeHome / 12;

  const totalRetirementAnnual =
    personA.preTax401kAnnual +
    personA.postTaxRetirementAnnual +
    (personB ? personB.preTax401kAnnual + personB.postTaxRetirementAnnual : 0);
  const totalEmployerMatchAnnual = personA.employerMatchAnnual + (personB?.employerMatchAnnual ?? 0);

  // Estimate individual net ratios for proportional bill splitting
  const personAGrossPlusSub = personA.totalGrossEarned + personA.taxFreeSubsidies;
  const personBGrossPlusSub = personB ? personB.totalGrossEarned + personB.taxFreeSubsidies : 0;
  const combinedGrossPlusSub = personAGrossPlusSub + personBGrossPlusSub;

  const personAShareRatio =
    filingMode === 'joint' && combinedGrossPlusSub > 0 ? personAGrossPlusSub / combinedGrossPlusSub : 1;
  const personBShareRatio = filingMode === 'joint' ? 1 - personAShareRatio : 0;

  const personANetMonthly = monthlyNetTakeHome * personAShareRatio;
  const personBNetMonthly = monthlyNetTakeHome * personBShareRatio;

  return {
    personA,
    personB,
    totalGrossIncome,
    totalTaxableBonuses,
    totalTaxFreeSubsidies,
    totalPreTaxDeductions,
    totalPostTaxDeductions,
    adjustedGrossIncome,
    standardDeduction,
    federalTaxableIncome,
    federalIncomeTax,
    stateIncomeTax,
    localIncomeTax,
    socialSecurityTax,
    medicareTax,
    totalFicaTax,
    totalTaxes,
    effectiveTaxRate,
    marginalFederalRate: fedResult.marginalRate * 100,
    annualNetTakeHome,
    monthlyNetTakeHome,
    totalRetirementAnnual,
    totalEmployerMatchAnnual,
    personANetMonthly,
    personBNetMonthly,
    personAShareRatio,
    personBShareRatio,
  };
}
