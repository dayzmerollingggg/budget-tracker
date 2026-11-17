import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Flame } from 'lucide-react';
import {
  HouseholdTaxSummary,
  ProjectionDataPoint,
  ProjectionSettings,
} from '../types/finance';
import { ExpenseMetrics, FireMetrics, formatCurrency } from '../utils/financeMath';

interface ChartsDashboardProps {
  taxSummary: HouseholdTaxSummary;
  expenseMetrics: ExpenseMetrics;
  totalGoalMonthly: number;
  remainingForInvestments: number;
  projectionSeries: ProjectionDataPoint[];
  projectionSettings: ProjectionSettings;
  onChangeProjectionSettings: (next: ProjectionSettings) => void;
  fireMetrics: FireMetrics;
  blendedNominalReturn: number;
  effectiveReturnUsed: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: number;
  currentAge: number;
}

const WealthTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, currentAge }) => {
  if (!active || !payload || payload.length === 0) return null;
  const yearNum = typeof label === 'number' ? label : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3.5 py-2.5 text-xs space-y-1.5 min-w-[210px]">
      <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
        <span>Year {yearNum}</span>
        <span className="text-slate-500 font-normal">Age {currentAge + yearNum}</span>
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span
              className="w-2 h-2 rounded-xs shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
          </div>
          <span className="font-mono-num font-semibold text-slate-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ChartsDashboard: React.FC<ChartsDashboardProps> = ({
  taxSummary,
  expenseMetrics,
  totalGoalMonthly,
  remainingForInvestments,
  projectionSeries,
  projectionSettings,
  onChangeProjectionSettings,
  fireMetrics,
  blendedNominalReturn,
  effectiveReturnUsed,
}) => {
  const finalPoint = projectionSeries[projectionSeries.length - 1] ?? {
    year: projectionSettings.horizonYears,
    totalNetWorth: 0,
    totalPrincipal: 0,
    compoundInterest: 0,
    retirement401k: 0,
    taxableBucketsTotal: 0,
    fireTarget: 0,
    age: projectionSettings.currentAge + projectionSettings.horizonYears,
  };

  // Monthly cashflow breakdown bar proportions
  const monthlyGrossTotal =
    (taxSummary.totalGrossIncome + taxSummary.totalTaxFreeSubsidies) / 12;
  const monthlyTaxes = taxSummary.totalTaxes / 12;
  const monthlyPayrollDeductions =
    (taxSummary.totalPreTaxDeductions + taxSummary.totalPostTaxDeductions) / 12;

  const totalMonthlySavingsAll =
    Math.max(0, remainingForInvestments) +
    totalGoalMonthly +
    (taxSummary.totalRetirementAnnual + taxSummary.totalEmployerMatchAnnual) / 12;

  const grossSavingsRate =
    monthlyGrossTotal > 0 ? (totalMonthlySavingsAll / monthlyGrossTotal) * 100 : 0;

  return (
    <div id="projections" className="space-y-5">
      {/* Real-Time Summary Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Monthly Cash Flow Snapshot</h2>
          <span className="text-xs text-slate-500 tabular-nums">
            Effective Tax {taxSummary.effectiveTaxRate.toFixed(1)}%
            <span className="mx-1.5">·</span>
            Total Savings Rate {grossSavingsRate.toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <div className="text-xs text-slate-500">Net Take-Home</div>
            <div className="font-mono-num text-xl font-bold text-slate-900 mt-0.5">
              {formatCurrency(taxSummary.monthlyNetTakeHome)}
            </div>
            <div className="text-[11px] font-mono-num text-slate-500">
              {formatCurrency(taxSummary.annualNetTakeHome)}/yr
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Total Expenses</div>
            <div className="font-mono-num text-xl font-bold text-slate-900 mt-0.5">
              {formatCurrency(expenseMetrics.totalMonthlyExpenses)}
            </div>
            <div className="text-[11px] font-mono-num text-slate-500">
              {taxSummary.monthlyNetTakeHome > 0
                ? `${((expenseMetrics.totalMonthlyExpenses / taxSummary.monthlyNetTakeHome) * 100).toFixed(0)}% of net`
                : '0% of net'}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Available Leftover</div>
            <div
              className={`font-mono-num text-xl font-bold mt-0.5 ${
                expenseMetrics.isOverspending ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {expenseMetrics.isOverspending
                ? `-${formatCurrency(expenseMetrics.monthlyDeficit)}`
                : formatCurrency(expenseMetrics.availableLeftoverBeforeGoals)}
            </div>
            <div className="text-[11px] font-mono-num text-slate-500">
              {formatCurrency(totalGoalMonthly)} in goals
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">To Investments</div>
            <div className="font-mono-num text-xl font-bold text-emerald-700 mt-0.5">
              {formatCurrency(remainingForInvestments)}
            </div>
            <div className="text-[11px] font-mono-num text-slate-500">
              +{formatCurrency((taxSummary.totalRetirementAnnual + taxSummary.totalEmployerMatchAnnual) / 12)} 401(k)
            </div>
          </div>
        </div>

        {/* Gross Dollar Allocation Bar */}
        {monthlyGrossTotal > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Gross Monthly Allocation</span>
              <span className="font-mono-num text-slate-500">
                {formatCurrency(monthlyGrossTotal)}/mo gross
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(monthlyTaxes / monthlyGrossTotal) * 100}%` }}
                className="bg-rose-500"
                title={`Taxes: ${formatCurrency(monthlyTaxes)}/mo`}
              />
              <div
                style={{ width: `${(monthlyPayrollDeductions / monthlyGrossTotal) * 100}%` }}
                className="bg-indigo-500"
                title={`Payroll Deductions: ${formatCurrency(monthlyPayrollDeductions)}/mo`}
              />
              <div
                style={{ width: `${(expenseMetrics.monthlyNeeds / monthlyGrossTotal) * 100}%` }}
                className="bg-slate-800"
                title={`Needs: ${formatCurrency(expenseMetrics.monthlyNeeds)}/mo`}
              />
              <div
                style={{ width: `${(expenseMetrics.monthlyWants / monthlyGrossTotal) * 100}%` }}
                className="bg-sky-500"
                title={`Wants: ${formatCurrency(expenseMetrics.monthlyWants)}/mo`}
              />
              <div
                style={{
                  width: `${
                    (Math.max(0, expenseMetrics.availableLeftoverBeforeGoals) / monthlyGrossTotal) *
                    100
                  }%`,
                }}
                className="bg-emerald-600"
                title={`Goals & Investing: ${formatCurrency(Math.max(0, expenseMetrics.availableLeftoverBeforeGoals))}/mo`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-rose-500" />
                Taxes ({formatCurrency(monthlyTaxes)})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                Payroll ({formatCurrency(monthlyPayrollDeductions)})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-slate-800" />
                Needs ({formatCurrency(expenseMetrics.monthlyNeeds)})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-sky-500" />
                Wants ({formatCurrency(expenseMetrics.monthlyWants)})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-emerald-600" />
                Goals & Invest ({formatCurrency(Math.max(0, expenseMetrics.availableLeftoverBeforeGoals))})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Compound Interest & Wealth Projection Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Compound Wealth Projection ({projectionSettings.horizonYears} Years)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Blended Yield {blendedNominalReturn.toFixed(1)}% nominal
              <span className="mx-1.5">·</span>
              {projectionSettings.adjustForInflation
                ? `${effectiveReturnUsed.toFixed(1)}% real (2.5% inflation adj.)`
                : 'Nominal dollars'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onChangeProjectionSettings({
                  ...projectionSettings,
                  adjustForInflation: !projectionSettings.adjustForInflation,
                })
              }
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                projectionSettings.adjustForInflation
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              Adjust for Inflation
            </button>

            <button
              type="button"
              onClick={() =>
                onChangeProjectionSettings({
                  ...projectionSettings,
                  fireModeEnabled: !projectionSettings.fireModeEnabled,
                })
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                projectionSettings.fireModeEnabled
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              FIRE Mode
            </button>
          </div>
        </div>

        {/* Horizon Slider */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/70 rounded-lg px-3.5 py-2.5">
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
            Projection Horizon
          </span>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            aria-label="Projection horizon in years"
            value={projectionSettings.horizonYears}
            onChange={(e) =>
              onChangeProjectionSettings({
                ...projectionSettings,
                horizonYears: parseInt(e.target.value, 10) || 25,
              })
            }
            className="flex-1"
          />
          <span className="font-mono-num text-xs font-semibold text-slate-900 w-16 text-right">
            {projectionSettings.horizonYears} {projectionSettings.horizonYears === 1 ? 'yr' : 'yrs'}
          </span>
        </div>

        {/* Chart Viewport */}
        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projectionSeries} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(yr) => `Yr ${yr}`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={62}
                tickFormatter={(val: number) => formatCurrency(val, true)}
              />
              <Tooltip content={<WealthTooltip currentAge={projectionSettings.currentAge} />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="square"
              />

              <Area
                type="monotone"
                dataKey="totalNetWorth"
                name="Total Net Worth"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#netWorthGrad)"
              />
              <Line
                type="monotone"
                dataKey="totalPrincipal"
                name="Total Principal"
                stroke="#475569"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="compoundInterest"
                name="Compound Interest"
                stroke="#0284c7"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="retirement401k"
                name="401(k) + Match"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />

              {projectionSettings.fireModeEnabled && fireMetrics.standardFireNumber > 0 && (
                <ReferenceLine
                  y={fireMetrics.standardFireNumber}
                  stroke="#d97706"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{
                    value: `FIRE Target: ${formatCurrency(fireMetrics.standardFireNumber, true)}`,
                    position: 'insideTopLeft',
                    fill: '#b45309',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* End-of-Horizon Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <div className="text-slate-500">Year {projectionSettings.horizonYears} Net Worth</div>
            <div className="font-mono-num text-sm font-bold text-emerald-700 mt-0.5">
              {formatCurrency(finalPoint.totalNetWorth)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Principal Contributed</div>
            <div className="font-mono-num text-sm font-semibold text-slate-900 mt-0.5">
              {formatCurrency(finalPoint.totalPrincipal)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Interest Earned</div>
            <div className="font-mono-num text-sm font-semibold text-sky-700 mt-0.5">
              {formatCurrency(finalPoint.compoundInterest)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">401(k) + Match</div>
            <div className="font-mono-num text-sm font-semibold text-indigo-700 mt-0.5">
              {formatCurrency(finalPoint.retirement401k)}
            </div>
          </div>
        </div>
      </div>

      {/* FIRE Milestone Callout Card */}
      {projectionSettings.fireModeEnabled && (
        <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-emerald-400 font-medium">
                FIRE Projection · {projectionSettings.safeWithdrawalRate.toFixed(1)}% Safe Withdrawal Rate
              </div>
              <div className="text-2xl font-bold font-mono-num tracking-wide mt-1">
                {fireMetrics.yearsToFireText}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Estimated time to reach Standard FIRE ({formatCurrency(fireMetrics.standardFireNumber)}) at your
                current monthly investment rate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <div className="text-slate-400">Lean FIRE (Needs)</div>
              <div className="font-mono-num text-sm font-semibold text-white mt-0.5">
                {formatCurrency(fireMetrics.leanFireNumber)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Standard FIRE</div>
              <div className="font-mono-num text-sm font-semibold text-emerald-400 mt-0.5">
                {formatCurrency(fireMetrics.standardFireNumber)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Coast FIRE (Age {projectionSettings.coastTargetAge})</div>
              <div className="font-mono-num text-sm font-semibold text-white mt-0.5">
                {formatCurrency(fireMetrics.coastFireNumber)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
