import {
  ExpenseItem,
  InvestmentBucket,
  PayFrequency,
  ProjectionDataPoint,
  ProjectionSettings,
  SavingsGoal,
} from '../types/finance';

export function normalizeExpenseToMonthly(amount: number, frequency: PayFrequency): number {
  const safe = Math.max(0, amount);
  switch (frequency) {
    case 'weekly':
      return (safe * 52) / 12;
    case 'biweekly':
      return (safe * 26) / 12;
    case 'monthly':
    default:
      return safe;
  }
}

export function fromMonthlyToFrequency(monthlyAmount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case 'weekly':
      return (monthlyAmount * 12) / 52;
    case 'biweekly':
      return (monthlyAmount * 12) / 26;
    case 'monthly':
    default:
      return monthlyAmount;
  }
}

export interface ExpenseMetrics {
  monthlyNeeds: number;
  monthlyWants: number;
  totalMonthlyExpenses: number;
  needsPercentOfNet: number;
  wantsPercentOfNet: number;
  savingsPercentOfNet: number;
  availableLeftoverBeforeGoals: number;
  isOverspending: boolean;
  monthlyDeficit: number;
  topExpenses: { id: string; name: string; monthlyAmount: number; category: 'needs' | 'wants' }[];
}

export function calculateExpenseMetrics(
  expenses: ExpenseItem[],
  monthlyNetTakeHome: number,
): ExpenseMetrics {
  let monthlyNeeds = 0;
  let monthlyWants = 0;

  const normalizedList = expenses.map((e) => {
    const monthlyAmount = normalizeExpenseToMonthly(e.amount, e.frequency);
    if (e.category === 'needs') {
      monthlyNeeds += monthlyAmount;
    } else {
      monthlyWants += monthlyAmount;
    }
    return {
      id: e.id,
      name: e.name,
      monthlyAmount,
      category: e.category,
    };
  });

  const totalMonthlyExpenses = monthlyNeeds + monthlyWants;
  const availableLeftoverBeforeGoals = monthlyNetTakeHome - totalMonthlyExpenses;
  const isOverspending = totalMonthlyExpenses > monthlyNetTakeHome;
  const monthlyDeficit = isOverspending ? totalMonthlyExpenses - monthlyNetTakeHome : 0;

  const safeNet = monthlyNetTakeHome > 0 ? monthlyNetTakeHome : 1;
  const needsPercentOfNet = (monthlyNeeds / safeNet) * 100;
  const wantsPercentOfNet = (monthlyWants / safeNet) * 100;
  const savingsPercentOfNet = Math.max(0, (availableLeftoverBeforeGoals / safeNet) * 100);

  const topExpenses = [...normalizedList]
    .filter((item) => item.monthlyAmount > 0)
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
    .slice(0, 3);

  return {
    monthlyNeeds,
    monthlyWants,
    totalMonthlyExpenses,
    needsPercentOfNet,
    wantsPercentOfNet,
    savingsPercentOfNet,
    availableLeftoverBeforeGoals,
    isOverspending,
    monthlyDeficit,
    topExpenses,
  };
}

export function calculateGoalsAllocation(
  goals: SavingsGoal[],
  availableLeftoverBeforeGoals: number,
): {
  totalGoalMonthly: number;
  remainingForInvestments: number;
  cappedGoals: SavingsGoal[];
} {
  if (availableLeftoverBeforeGoals <= 0) {
    return {
      totalGoalMonthly: 0,
      remainingForInvestments: 0,
      cappedGoals: goals.map((g) => ({ ...g, monthlyContribution: 0 })),
    };
  }

  let budgetLeft = availableLeftoverBeforeGoals;
  const cappedGoals = goals.map((g) => {
    const allowed = Math.min(Math.max(0, g.monthlyContribution), budgetLeft);
    budgetLeft = Math.max(0, budgetLeft - allowed);
    return { ...g, monthlyContribution: allowed };
  });

  const totalGoalMonthly = cappedGoals.reduce((sum, g) => sum + g.monthlyContribution, 0);
  const remainingForInvestments = Math.max(0, availableLeftoverBeforeGoals - totalGoalMonthly);

  return {
    totalGoalMonthly,
    remainingForInvestments,
    cappedGoals,
  };
}

export function getBlendedAnnualReturn(buckets: InvestmentBucket[]): number {
  const totalAlloc = buckets.reduce((sum, b) => sum + Math.max(0, b.allocationPercent), 0);
  if (totalAlloc <= 0) return 0;
  const weighted = buckets.reduce(
    (sum, b) => sum + (Math.max(0, b.allocationPercent) / totalAlloc) * (b.expectedApy / 100),
    0,
  );
  return weighted;
}

export interface FireMetrics {
  swrMultiplier: number;
  standardFireNumber: number;
  leanFireNumber: number;
  coastFireNumber: number;
  monthsToFire: number | null; // null if unreachable within 80 years
  yearsToFireText: string;
  fireAchievedYear: number | null;
}

export function calculateWealthProjections(
  monthlyTaxableInvestment: number,
  monthlyGoalsSavings: number,
  annualRetirementContributions: number,
  annualEmployerMatch: number,
  buckets: InvestmentBucket[],
  settings: ProjectionSettings,
  totalMonthlyExpenses: number,
  monthlyNeeds: number,
): {
  series: ProjectionDataPoint[];
  fire: FireMetrics;
  blendedNominalReturn: number;
  effectiveReturnUsed: number;
} {
  const blendedNominalReturn = getBlendedAnnualReturn(buckets);
  const inflation = settings.adjustForInflation ? settings.inflationRate / 100 : 0;

  // Real rate via Fisher equation: (1 + r) / (1 + i) - 1
  const toRealRate = (nominal: number) => (1 + nominal) / (1 + inflation) - 1;

  const effectiveTaxableReturn = toRealRate(blendedNominalReturn);
  // Retirement 401(k) assumed in diversified index funds (use index bucket rate or 8.0%)
  const indexBucket = buckets.find((b) => b.id === 'index');
  const nominal401kRate = indexBucket ? indexBucket.expectedApy / 100 : 0.085;
  const effective401kReturn = toRealRate(nominal401kRate);

  const swr = Math.max(0.03, Math.min(0.05, settings.safeWithdrawalRate / 100));
  const swrMultiplier = 1 / swr;
  const annualExpenses = totalMonthlyExpenses * 12;
  const annualNeeds = monthlyNeeds * 12;

  const standardFireNumber = annualExpenses * swrMultiplier;
  const leanFireNumber = annualNeeds * swrMultiplier;

  const coastYears = Math.max(1, settings.coastTargetAge - settings.currentAge);
  const coastRate = Math.max(0.01, effective401kReturn);
  const coastFireNumber = standardFireNumber / Math.pow(1 + coastRate, coastYears);

  const monthly401kTotal = (annualRetirementContributions + annualEmployerMatch) / 12;
  const monthlyTaxableTotal = Math.max(0, monthlyTaxableInvestment);

  // Simulate month-by-month up to max(horizonYears, 75) to determine exact FIRE timing
  const maxSimYears = Math.max(settings.horizonYears, 75);
  let taxableBal = Math.max(0, settings.startingInvestedBalance);
  let retirementBal = Math.max(0, settings.startingRetirementBalance);
  let principalContrib =
    Math.max(0, settings.startingInvestedBalance) +
    Math.max(0, settings.startingRetirementBalance);

  const monthlyTaxableRate = Math.pow(1 + effectiveTaxableReturn, 1 / 12) - 1;
  const monthly401kRate = Math.pow(1 + effective401kReturn, 1 / 12) - 1;

  const series: ProjectionDataPoint[] = [
    {
      year: 0,
      age: settings.currentAge,
      totalPrincipal: Math.round(principalContrib),
      compoundInterest: 0,
      retirement401k: Math.round(retirementBal),
      taxableBucketsTotal: Math.round(taxableBal),
      totalNetWorth: Math.round(taxableBal + retirementBal),
      fireTarget: Math.round(standardFireNumber),
    },
  ];

  let monthsToFire: number | null =
    standardFireNumber > 0 && taxableBal + retirementBal >= standardFireNumber ? 0 : null;

  for (let m = 1; m <= maxSimYears * 12; m++) {
    taxableBal = taxableBal * (1 + monthlyTaxableRate) + monthlyTaxableTotal;
    retirementBal = retirementBal * (1 + monthly401kRate) + monthly401kTotal;
    principalContrib += monthlyTaxableTotal + monthly401kTotal;

    const totalNW = taxableBal + retirementBal;
    if (monthsToFire === null && standardFireNumber > 0 && totalNW >= standardFireNumber) {
      monthsToFire = m;
    }

    if (m % 12 === 0) {
      const yr = m / 12;
      if (yr <= settings.horizonYears) {
        const interestEarned = Math.max(0, totalNW - principalContrib);
        series.push({
          year: yr,
          age: settings.currentAge + yr,
          totalPrincipal: Math.round(principalContrib),
          compoundInterest: Math.round(interestEarned),
          retirement401k: Math.round(retirementBal),
          taxableBucketsTotal: Math.round(taxableBal),
          totalNetWorth: Math.round(totalNW),
          fireTarget: Math.round(standardFireNumber),
        });
      }
    }
  }

  let yearsToFireText = 'Not reached in 75 yrs';
  let fireAchievedYear: number | null = null;
  if (standardFireNumber <= 0) {
    yearsToFireText = 'Add expenses to compute';
  } else if (monthsToFire !== null) {
    const yrs = Math.floor(monthsToFire / 12);
    const mos = monthsToFire % 12;
    yearsToFireText = yrs === 0 && mos === 0 ? 'Achieved now' : `${yrs} yrs, ${mos} mos`;
    fireAchievedYear = Number((monthsToFire / 12).toFixed(1));
  }

  return {
    series,
    fire: {
      swrMultiplier,
      standardFireNumber,
      leanFireNumber,
      coastFireNumber,
      monthsToFire,
      yearsToFireText,
      fireAchievedYear,
    },
    blendedNominalReturn: blendedNominalReturn * 100,
    effectiveReturnUsed: effectiveTaxableReturn * 100,
  };
}

export function formatCurrency(value: number, compact = false): string {
  if (!Number.isFinite(value)) return '$0';
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 10_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyPrecise(value: number): string {
  if (!Number.isFinite(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
