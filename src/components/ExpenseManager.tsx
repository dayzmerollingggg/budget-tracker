import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  ExpenseCategory,
  ExpenseItem,
  FilingMode,
  HouseholdTaxSummary,
  JointViewMode,
  PayFrequency,
} from '../types/finance';
import {
  ExpenseMetrics,
  formatCurrency,
  fromMonthlyToFrequency,
  normalizeExpenseToMonthly,
} from '../utils/financeMath';

interface ExpenseManagerProps {
  filingMode: FilingMode;
  jointViewMode: JointViewMode;
  onChangeJointViewMode: (mode: JointViewMode) => void;
  expenses: ExpenseItem[];
  onChangeExpenses: (next: ExpenseItem[]) => void;
  expenseMetrics: ExpenseMetrics;
  taxSummary: HouseholdTaxSummary;
  liquidSavings: number;
  onChangeLiquidSavings: (amount: number) => void;
  totalMonthlyGoalsAndInvesting: number;
}

const SUGGESTED_NEEDS: { name: string; defaultAmount: number }[] = [
  { name: 'Rent / Mortgage', defaultAmount: 2000 },
  { name: 'Electric & Gas', defaultAmount: 150 },
  { name: 'Water/Trash', defaultAmount: 65 },
  { name: 'Internet', defaultAmount: 75 },
  { name: 'Groceries', defaultAmount: 550 },
  { name: 'Car Payment', defaultAmount: 380 },
  { name: 'Auto Insurance', defaultAmount: 160 },
  { name: 'Gas/Transit', defaultAmount: 140 },
  { name: 'Phone Bill', defaultAmount: 70 },
  { name: 'Minimum Debt Payments', defaultAmount: 200 },
];

const SUGGESTED_WANTS: { name: string; defaultAmount: number }[] = [
  { name: 'Dining Out', defaultAmount: 300 },
  { name: 'Streaming & Subscriptions', defaultAmount: 55 },
  { name: 'Gym/Fitness', defaultAmount: 70 },
  { name: 'Shopping', defaultAmount: 200 },
  { name: 'Travel/Entertainment', defaultAmount: 250 },
];

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  filingMode,
  jointViewMode,
  onChangeJointViewMode,
  expenses,
  onChangeExpenses,
  expenseMetrics,
  taxSummary,
  liquidSavings,
  onChangeLiquidSavings,
  totalMonthlyGoalsAndInvesting,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<PayFrequency>('monthly');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('needs');

  const addExpense = (
    name: string,
    amount: number,
    frequency: PayFrequency,
    category: ExpenseCategory,
  ) => {
    const next: ExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      amount: Math.max(0, amount),
      frequency,
      category,
    };
    onChangeExpenses([...expenses, next]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const parsed = parseFloat(newAmount);
    addExpense(trimmed, Number.isNaN(parsed) ? 0 : Math.max(0, parsed), newFrequency, newCategory);
    setNewName('');
    setNewAmount('');
  };

  const updateExpense = (id: string, patch: Partial<ExpenseItem>) => {
    onChangeExpenses(expenses.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeExpense = (id: string) => {
    onChangeExpenses(expenses.filter((item) => item.id !== id));
  };

  const existingNamesLower = new Set(expenses.map((e) => e.name.toLowerCase()));

  // Emergency Fund Runway calculation
  const runwayMonths =
    expenseMetrics.monthlyNeeds > 0 ? liquidSavings / expenseMetrics.monthlyNeeds : 0;
  const runwayStatus =
    expenseMetrics.monthlyNeeds <= 0
      ? 'Add Needs expenses'
      : runwayMonths >= 6
        ? 'Strong (6+ mos)'
        : runwayMonths >= 3
          ? 'On Track (3–6 mos)'
          : 'Building (<3 mos)';

  // 50/30/20 Gauge values capped cleanly for bar display
  const totalRatioSum =
    expenseMetrics.needsPercentOfNet +
    expenseMetrics.wantsPercentOfNet +
    expenseMetrics.savingsPercentOfNet;
  const barScale = totalRatioSum > 100 ? 100 / totalRatioSum : 1;

  return (
    <section id="expenses" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            02. Smart Expense Manager & Budgeting Tactics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Total {formatCurrency(expenseMetrics.totalMonthlyExpenses)}/mo
            <span className="mx-1.5">·</span>
            Needs {formatCurrency(expenseMetrics.monthlyNeeds)}
            <span className="mx-1.5">·</span>
            Wants {formatCurrency(expenseMetrics.monthlyWants)}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-6">
          {/* Overspending Alert Banner */}
          {expenseMetrics.isOverspending && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-950 space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-900">
                    Monthly Deficit Alert: Overspending by{' '}
                    <span className="font-mono-num">{formatCurrency(expenseMetrics.monthlyDeficit)}/mo</span>
                  </h3>
                  <p className="text-xs text-red-800 mt-1">
                    Normalized monthly expenses ({formatCurrency(expenseMetrics.totalMonthlyExpenses)}) exceed
                    Net Take-Home Pay ({formatCurrency(taxSummary.monthlyNetTakeHome)}).
                  </p>
                </div>
              </div>
              {expenseMetrics.topExpenses.length > 0 && (
                <div className="pl-7 text-xs text-red-800 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">Largest categories:</span>
                  {expenseMetrics.topExpenses.map((top) => (
                    <span key={top.id} className="font-mono-num">
                      {top.name} ({formatCurrency(top.monthlyAmount)}/mo)
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Joint Sub-Toggle: Combined vs Proportional Split */}
          {filingMode === 'joint' && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-lg p-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">Household Bill View</div>
                <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                  Income Ratio: Person A {(taxSummary.personAShareRatio * 100).toFixed(1)}%
                  <span className="mx-1.5">·</span>
                  Person B {(taxSummary.personBShareRatio * 100).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => onChangeJointViewMode('combined')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    jointViewMode === 'combined'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Combined Household
                </button>
                <button
                  type="button"
                  onClick={() => onChangeJointViewMode('proportional')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    jointViewMode === 'proportional'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Proportional Split
                </button>
              </div>
            </div>
          )}

          {filingMode === 'joint' && jointViewMode === 'proportional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg p-3.5">
              <div>
                <div className="text-slate-500 font-medium">
                  Person A Fair Share ({(taxSummary.personAShareRatio * 100).toFixed(1)}%)
                </div>
                <div className="font-mono-num text-base font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(expenseMetrics.totalMonthlyExpenses * taxSummary.personAShareRatio)}/mo
                </div>
                <div className="text-slate-500 font-mono-num mt-0.5">
                  Net: {formatCurrency(taxSummary.personANetMonthly)}/mo
                </div>
              </div>
              <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="text-slate-500 font-medium">
                  Person B Fair Share ({(taxSummary.personBShareRatio * 100).toFixed(1)}%)
                </div>
                <div className="font-mono-num text-base font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(expenseMetrics.totalMonthlyExpenses * taxSummary.personBShareRatio)}/mo
                </div>
                <div className="text-slate-500 font-mono-num mt-0.5">
                  Net: {formatCurrency(taxSummary.personBNetMonthly)}/mo
                </div>
              </div>
            </div>
          )}

          {/* Quick-Add Suggested Expenses */}
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                Quick-Add Needs (50% Benchmark)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_NEEDS.map((chip) => {
                  const alreadyAdded = existingNamesLower.has(chip.name.toLowerCase());
                  return (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => addExpense(chip.name, chip.defaultAmount, 'monthly', 'needs')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                        alreadyAdded
                          ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:text-emerald-800'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      {chip.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                Quick-Add Wants (30% Benchmark)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_WANTS.map((chip) => {
                  const alreadyAdded = existingNamesLower.has(chip.name.toLowerCase());
                  return (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => addExpense(chip.name, chip.defaultAmount, 'monthly', 'wants')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                        alreadyAdded
                          ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-950'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      {chip.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Custom Expense Form */}
          <form onSubmit={handleCustomSubmit} className="grid grid-cols-12 gap-2 items-end pt-2 border-t border-slate-100">
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Expense Name</label>
              <input
                type="text"
                placeholder="e.g., Childcare, Pet Care"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount</label>
              <input
                type="number"
                min={0}
                step={5}
                placeholder="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full text-xs font-mono-num px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-900"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Frequency</label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as PayFrequency)}
                className="w-full text-xs px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Type</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="needs">Need</option>
                <option value="wants">Want</option>
              </select>
            </div>
            <div className="col-span-12 sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </form>

          {/* Expense Ledger Table */}
          <div>
            {expenses.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">
                  No expenses listed yet. Click a quick-add chip above or add a custom expense.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {expenses.map((item) => {
                  const monthlyEq = normalizeExpenseToMonthly(item.amount, item.frequency);
                  return (
                    <div key={item.id} className="py-2.5 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          aria-label="Expense name"
                          onChange={(e) => updateExpense(item.id, { name: e.target.value })}
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-600 focus:bg-white rounded px-1.5 py-1 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          aria-label={`${item.name} amount`}
                          value={item.amount || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateExpense(item.id, { amount: Number.isNaN(val) ? 0 : Math.max(0, val) });
                          }}
                          className="w-full text-right font-mono-num text-sm pl-5 pr-2 py-1 border border-slate-200 rounded bg-white text-slate-900"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <select
                          aria-label={`${item.name} frequency`}
                          value={item.frequency}
                          onChange={(e) =>
                            updateExpense(item.id, { frequency: e.target.value as PayFrequency })
                          }
                          className="w-full text-xs px-1.5 py-1.5 border border-slate-200 rounded bg-white text-slate-700"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="biweekly">Bi-Weekly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <select
                          aria-label={`${item.name} category`}
                          value={item.category}
                          onChange={(e) =>
                            updateExpense(item.id, { category: e.target.value as ExpenseCategory })
                          }
                          className={`w-full text-xs font-medium px-1.5 py-1.5 border rounded ${
                            item.category === 'needs'
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-amber-50/70 border-amber-200 text-amber-900'
                          }`}
                        >
                          <option value="needs">Need</option>
                          <option value="wants">Want</option>
                        </select>
                      </div>

                      <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <div className="text-right">
                          <div className="text-xs font-mono-num font-semibold text-slate-800">
                            {formatCurrency(monthlyEq)}/mo
                          </div>
                          {filingMode === 'joint' && jointViewMode === 'proportional' && (
                            <div className="text-[10px] font-mono-num text-slate-500">
                              A: {formatCurrency(monthlyEq * taxSummary.personAShareRatio)} · B:{' '}
                              {formatCurrency(monthlyEq * taxSummary.personBShareRatio)}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExpense(item.id)}
                          aria-label={`Delete ${item.name}`}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Built-In Budgeting Tactics Widgets */}
          <div className="pt-2 space-y-5">
            {/* 50/30/20 Rule Gauge */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-800">
                  50 / 30 / 20 Rule Gauge (% of Net Take-Home)
                </h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  Benchmark: 50% Needs · 30% Wants · 20% Savings
                </span>
              </div>

              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.max(0, expenseMetrics.needsPercentOfNet * barScale)}%` }}
                  className={`h-full transition-all ${
                    expenseMetrics.needsPercentOfNet > 55 ? 'bg-red-500' : 'bg-slate-800'
                  }`}
                  title={`Needs: ${expenseMetrics.needsPercentOfNet.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${Math.max(0, expenseMetrics.wantsPercentOfNet * barScale)}%` }}
                  className={`h-full transition-all ${
                    expenseMetrics.wantsPercentOfNet > 35 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  title={`Wants: ${expenseMetrics.wantsPercentOfNet.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${Math.max(0, expenseMetrics.savingsPercentOfNet * barScale)}%` }}
                  className="h-full bg-emerald-600 transition-all"
                  title={`Savings: ${expenseMetrics.savingsPercentOfNet.toFixed(1)}%`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Needs (Target 50%)</span>
                  <div className="font-mono-num font-semibold text-slate-900">
                    {expenseMetrics.needsPercentOfNet.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Wants (Target 30%)</span>
                  <div className="font-mono-num font-semibold text-slate-900">
                    {expenseMetrics.wantsPercentOfNet.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Savings (Target 20%+)</span>
                  <div
                    className={`font-mono-num font-semibold ${
                      expenseMetrics.savingsPercentOfNet >= 20 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {expenseMetrics.savingsPercentOfNet.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Fund Runway & Pay-Yourself-First Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
              {/* Emergency Fund Runway */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800">Emergency Fund Runway</h3>
                  <span
                    className={`text-xs font-medium ${
                      runwayMonths >= 6
                        ? 'text-emerald-700'
                        : runwayMonths >= 3
                          ? 'text-sky-700'
                          : 'text-amber-700'
                    }`}
                  >
                    {runwayStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      aria-label="Current liquid emergency savings"
                      value={liquidSavings || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChangeLiquidSavings(Number.isNaN(val) ? 0 : Math.max(0, val));
                      }}
                      className="w-full pl-6 pr-2.5 py-1.5 text-sm font-mono-num border border-slate-200 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-num text-base font-bold text-slate-900">
                      {runwayMonths.toFixed(1)} mos
                    </div>
                    <div className="text-[11px] text-slate-500">Benchmark: 3–6 mos</div>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (runwayMonths / 6) * 100)}%` }}
                    className={`h-full transition-all ${
                      runwayMonths >= 6 ? 'bg-emerald-600' : runwayMonths >= 3 ? 'bg-sky-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Pay-Yourself-First Allocation */}
              <div className="space-y-2 md:border-l md:border-slate-100 md:pl-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Pay-Yourself-First Auto-Transfer
                  </h3>
                  <span className="text-[11px] text-slate-500">Goals + Investing</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-2">
                    <div className="text-[11px] text-slate-500">Weekly</div>
                    <div className="font-mono-num text-sm font-semibold text-slate-900 mt-0.5">
                      {formatCurrency(fromMonthlyToFrequency(totalMonthlyGoalsAndInvesting, 'weekly'))}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-2">
                    <div className="text-[11px] text-slate-500">Bi-Weekly</div>
                    <div className="font-mono-num text-sm font-semibold text-slate-900 mt-0.5">
                      {formatCurrency(fromMonthlyToFrequency(totalMonthlyGoalsAndInvesting, 'biweekly'))}
                    </div>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg px-2.5 py-2">
                    <div className="text-[11px] text-emerald-800">Monthly</div>
                    <div className="font-mono-num text-sm font-semibold text-emerald-900 mt-0.5">
                      {formatCurrency(totalMonthlyGoalsAndInvesting)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
