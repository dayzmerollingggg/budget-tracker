import { useMemo, useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { ChartsDashboard } from './components/ChartsDashboard';
import { ExpenseManager } from './components/ExpenseManager';
import { GoalsAndFire } from './components/GoalsAndFire';
import { IncomePanel } from './components/IncomePanel';
import {
  ExpenseItem,
  FilingMode,
  InvestmentBucket,
  JointViewMode,
  PersonIncomeProfile,
  ProjectionSettings,
  SavingsGoal,
  TaxLocationConfig,
} from './types/finance';
import {
  getBlankPerson,
  getBlankProjectionSettings,
  getDefaultBuckets,
  getDefaultLocation,
  getSampleExpenses,
  getSampleGoals,
  getSamplePersonA,
  getSamplePersonB,
  getSampleProjectionSettings,
} from './utils/defaults';
import {
  calculateExpenseMetrics,
  calculateGoalsAllocation,
  calculateWealthProjections,
} from './utils/financeMath';
import { calculateHouseholdTaxes } from './utils/taxEngine';

export default function App() {
  const [filingMode, setFilingMode] = useState<FilingMode>('individual');
  const [jointViewMode, setJointViewMode] = useState<JointViewMode>('combined');
  const [personA, setPersonA] = useState<PersonIncomeProfile>(getSamplePersonA);
  const [personB, setPersonB] = useState<PersonIncomeProfile>(getSamplePersonB);
  const [location, setLocation] = useState<TaxLocationConfig>(getDefaultLocation);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(getSampleExpenses);
  const [liquidSavings, setLiquidSavings] = useState<number>(12500);
  const [goals, setGoals] = useState<SavingsGoal[]>(getSampleGoals);
  const [buckets, setBuckets] = useState<InvestmentBucket[]>(getDefaultBuckets);
  const [projectionSettings, setProjectionSettings] = useState<ProjectionSettings>(
    getSampleProjectionSettings,
  );
  const [isResetBlank, setIsResetBlank] = useState<boolean>(false);

  const handleResetAllData = () => {
    setFilingMode('individual');
    setJointViewMode('combined');
    setPersonA(getBlankPerson('Person A'));
    setPersonB(getBlankPerson('Person B'));
    setLocation(getDefaultLocation());
    setExpenses([]);
    setLiquidSavings(0);
    setGoals([]);
    setBuckets(getDefaultBuckets());
    setProjectionSettings(getBlankProjectionSettings());
    setIsResetBlank(true);
  };

  const handleLoadSampleData = () => {
    setPersonA(getSamplePersonA());
    setPersonB(getSamplePersonB());
    setLocation(getDefaultLocation());
    setExpenses(getSampleExpenses());
    setLiquidSavings(12500);
    setGoals(getSampleGoals());
    setBuckets(getDefaultBuckets());
    setProjectionSettings(getSampleProjectionSettings());
    setIsResetBlank(false);
  };

  const taxSummary = useMemo(
    () => calculateHouseholdTaxes(filingMode, personA, personB, location),
    [filingMode, personA, personB, location],
  );

  const expenseMetrics = useMemo(
    () => calculateExpenseMetrics(expenses, taxSummary.monthlyNetTakeHome),
    [expenses, taxSummary.monthlyNetTakeHome],
  );

  const goalsAllocation = useMemo(
    () => calculateGoalsAllocation(goals, expenseMetrics.availableLeftoverBeforeGoals),
    [goals, expenseMetrics.availableLeftoverBeforeGoals],
  );

  const wealthProjections = useMemo(
    () =>
      calculateWealthProjections(
        goalsAllocation.remainingForInvestments,
        goalsAllocation.totalGoalMonthly,
        taxSummary.totalRetirementAnnual,
        taxSummary.totalEmployerMatchAnnual,
        buckets,
        projectionSettings,
        expenseMetrics.totalMonthlyExpenses,
        expenseMetrics.monthlyNeeds,
      ),
    [
      goalsAllocation.remainingForInvestments,
      goalsAllocation.totalGoalMonthly,
      taxSummary.totalRetirementAnnual,
      taxSummary.totalEmployerMatchAnnual,
      buckets,
      projectionSettings,
      expenseMetrics.totalMonthlyExpenses,
      expenseMetrics.monthlyNeeds,
    ],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 clean zones */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            ClearPath Finance
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#income-tax"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Income & Tax
            </a>
            <a
              href="#expenses"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Expenses
            </a>
            <a
              href="#goals-fire"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Goals & FIRE
            </a>
            <a
              href="#projections"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Projections
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetAllData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Data
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Toolbar: Filing Mode + Stateless Privacy Guarantee */}
      <div id="top" className="bg-white/80 border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/70">
              <button
                type="button"
                onClick={() => setFilingMode('individual')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filingMode === 'individual'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setFilingMode('joint')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filingMode === 'joint'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Joint / Household
              </button>
            </div>

            {isResetBlank && (
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2 whitespace-nowrap"
              >
                Load Sample Numbers
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              100% Client-Side & Stateless · Zero data is stored, cached, or transmitted
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Financial Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Inputs & Collapsible Accordions */}
          <div className="lg:col-span-6 space-y-5">
            <IncomePanel
              filingMode={filingMode}
              personA={personA}
              personB={personB}
              location={location}
              taxSummary={taxSummary}
              onChangePersonA={setPersonA}
              onChangePersonB={setPersonB}
              onChangeLocation={setLocation}
            />

            <ExpenseManager
              filingMode={filingMode}
              jointViewMode={jointViewMode}
              onChangeJointViewMode={setJointViewMode}
              expenses={expenses}
              onChangeExpenses={setExpenses}
              expenseMetrics={expenseMetrics}
              taxSummary={taxSummary}
              liquidSavings={liquidSavings}
              onChangeLiquidSavings={setLiquidSavings}
              totalMonthlyGoalsAndInvesting={Math.max(0, expenseMetrics.availableLeftoverBeforeGoals)}
            />

            <GoalsAndFire
              goals={goals}
              cappedGoals={goalsAllocation.cappedGoals}
              onChangeGoals={setGoals}
              availableLeftoverBeforeGoals={expenseMetrics.availableLeftoverBeforeGoals}
              totalGoalMonthly={goalsAllocation.totalGoalMonthly}
              remainingForInvestments={goalsAllocation.remainingForInvestments}
              buckets={buckets}
              onChangeBuckets={setBuckets}
              projectionSettings={projectionSettings}
              onChangeProjectionSettings={setProjectionSettings}
              fireMetrics={wealthProjections.fire}
              blendedNominalReturn={wealthProjections.blendedNominalReturn}
            />
          </div>

          {/* Right Column (Sticky): Summary Cards & Interactive Charts */}
          <div className="lg:col-span-6 lg:sticky lg:top-6">
            <ChartsDashboard
              taxSummary={taxSummary}
              expenseMetrics={expenseMetrics}
              totalGoalMonthly={goalsAllocation.totalGoalMonthly}
              remainingForInvestments={goalsAllocation.remainingForInvestments}
              projectionSeries={wealthProjections.series}
              projectionSettings={projectionSettings}
              onChangeProjectionSettings={setProjectionSettings}
              fireMetrics={wealthProjections.fire}
              blendedNominalReturn={wealthProjections.blendedNominalReturn}
              effectiveReturnUsed={wealthProjections.effectiveReturnUsed}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>ClearPath Finance · In-Memory Session Only (Clears on Tab Refresh)</span>
          <span>2026 Federal Brackets & FICA Estimates · Educational Planning Tool</span>
        </div>
      </footer>
    </div>
  );
}
