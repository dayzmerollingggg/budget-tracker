import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Flame, Lock, Plus, Trash2 } from 'lucide-react';
import {
  InvestmentBucket,
  ProjectionSettings,
  SavingsGoal,
} from '../types/finance';
import { FireMetrics, formatCurrency } from '../utils/financeMath';

interface GoalsAndFireProps {
  goals: SavingsGoal[];
  cappedGoals: SavingsGoal[];
  onChangeGoals: (next: SavingsGoal[]) => void;
  availableLeftoverBeforeGoals: number;
  totalGoalMonthly: number;
  remainingForInvestments: number;
  buckets: InvestmentBucket[];
  onChangeBuckets: (next: InvestmentBucket[]) => void;
  projectionSettings: ProjectionSettings;
  onChangeProjectionSettings: (next: ProjectionSettings) => void;
  fireMetrics: FireMetrics;
  blendedNominalReturn: number;
}

export const GoalsAndFire: React.FC<GoalsAndFireProps> = ({
  goals,
  cappedGoals,
  onChangeGoals,
  availableLeftoverBeforeGoals,
  totalGoalMonthly,
  remainingForInvestments,
  buckets,
  onChangeBuckets,
  projectionSettings,
  onChangeProjectionSettings,
  fireMetrics,
  blendedNominalReturn,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('10000');

  const isLocked = availableLeftoverBeforeGoals <= 0;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGoalName.trim();
    if (!trimmed) return;
    const target = Math.max(100, parseFloat(newGoalTarget) || 5000);
    const defaultMonthly =
      remainingForInvestments > 0 ? Math.min(250, Math.round(remainingForInvestments)) : 0;

    const nextGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: trimmed,
      targetAmount: target,
      monthlyContribution: defaultMonthly,
    };
    onChangeGoals([...goals, nextGoal]);
    setNewGoalName('');
    setNewGoalTarget('10000');
  };

  const updateGoal = (id: string, patch: Partial<SavingsGoal>) => {
    onChangeGoals(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGoal = (id: string) => {
    onChangeGoals(goals.filter((g) => g.id !== id));
  };

  const getMaxAllowedForGoal = (goalId: string): number => {
    if (availableLeftoverBeforeGoals <= 0) return 0;
    const otherSum = cappedGoals
      .filter((g) => g.id !== goalId)
      .reduce((sum, g) => sum + Math.max(0, g.monthlyContribution), 0);
    return Math.max(0, Math.floor(availableLeftoverBeforeGoals - otherSum));
  };

  const totalBucketAlloc = buckets.reduce((sum, b) => sum + Math.max(0, b.allocationPercent), 0);

  const normalizeBuckets = () => {
    if (totalBucketAlloc <= 0) {
      const equal = 100 / buckets.length;
      onChangeBuckets(buckets.map((b) => ({ ...b, allocationPercent: equal })));
      return;
    }
    let running = 0;
    const normalized = buckets.map((b, idx) => {
      if (idx === buckets.length - 1) {
        return { ...b, allocationPercent: Math.max(0, Math.round((100 - running) * 10) / 10) };
      }
      const nextPct = Math.round(((b.allocationPercent / totalBucketAlloc) * 100) * 10) / 10;
      running += nextPct;
      return { ...b, allocationPercent: nextPct };
    });
    onChangeBuckets(normalized);
  };

  return (
    <section id="goals-fire" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            03. Target Savings Goals, Investing & FIRE
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Goals {formatCurrency(totalGoalMonthly)}/mo
            <span className="mx-1.5">·</span>
            Investing {formatCurrency(remainingForInvestments)}/mo
            <span className="mx-1.5">·</span>
            Blended APY {blendedNominalReturn.toFixed(1)}%
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-7">
          {/* Interactive Target Savings Goals */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Target Savings Goals</h3>
                <p className="text-xs text-slate-500">
                  Bidirectional sliders automatically update timeline and cap at Available Leftover Cash (
                  <span className="font-mono-num font-semibold text-slate-800">
                    {formatCurrency(Math.max(0, availableLeftoverBeforeGoals))}/mo
                  </span>
                  ).
                </p>
              </div>
            </div>

            {isLocked && (
              <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Available Leftover Cash is $0 or negative. Reduce expenses or increase income to unlock
                  monthly goal contributions.
                </span>
              </div>
            )}

            <div className="space-y-4">
              {cappedGoals.map((goal) => {
                const maxMonthly = getMaxAllowedForGoal(goal.id);
                const effectiveMonthly = isLocked ? 0 : Math.min(goal.monthlyContribution, maxMonthly);
                const computedMonths =
                  effectiveMonthly > 0
                    ? Math.max(1, Math.ceil(goal.targetAmount / effectiveMonthly))
                    : 120;
                const clampedMonthsSlider = Math.min(120, Math.max(1, computedMonths));
                const minAchievableMonths =
                  maxMonthly > 0 ? Math.max(1, Math.ceil(goal.targetAmount / maxMonthly)) : 120;

                return (
                  <div
                    key={goal.id}
                    className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-lg space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                        <input
                          type="text"
                          value={goal.name}
                          aria-label="Goal name"
                          onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                          className="text-sm font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white rounded px-1.5 py-0.5 focus:outline-none w-full max-w-[240px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Target:</label>
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            min={100}
                            step={500}
                            aria-label={`${goal.name} target amount`}
                            value={goal.targetAmount || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateGoal(goal.id, {
                                targetAmount: Number.isNaN(val) ? 0 : Math.max(0, val),
                              });
                            }}
                            className="w-full text-right font-mono-num text-xs font-semibold pl-5 pr-2 py-1 border border-slate-200 rounded bg-white text-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGoal(goal.id)}
                          aria-label={`Delete ${goal.name}`}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Slider 1: Monthly Contribution */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">Monthly Contribution</span>
                          <span className="font-mono-num font-semibold text-slate-900">
                            {formatCurrency(effectiveMonthly)}/mo
                            <span className="text-slate-400 font-normal ml-1">
                              (max {formatCurrency(maxMonthly)})
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(1, maxMonthly)}
                          step={Math.max(5, Math.round(maxMonthly / 100) || 5)}
                          disabled={isLocked || maxMonthly <= 0}
                          value={effectiveMonthly}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateGoal(goal.id, {
                              monthlyContribution: Number.isNaN(val) ? 0 : Math.min(maxMonthly, val),
                            });
                          }}
                          className="w-full"
                        />
                      </div>

                      {/* Slider 2: Months to Achieve Goal */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">Months to Achieve Goal</span>
                          <span className="font-mono-num font-semibold text-emerald-700">
                            {effectiveMonthly > 0
                              ? `${computedMonths} ${computedMonths === 1 ? 'month' : 'months'}`
                              : 'Paused ($0/mo)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={120}
                          step={1}
                          disabled={isLocked || maxMonthly <= 0}
                          value={clampedMonthsSlider}
                          onChange={(e) => {
                            const targetMonths = Math.max(1, parseInt(e.target.value, 10) || 1);
                            const requiredMonthly = Math.ceil(goal.targetAmount / targetMonths);
                            const clampedMonthly = Math.min(maxMonthly, requiredMonthly);
                            updateGoal(goal.id, { monthlyContribution: clampedMonthly });
                          }}
                          className="w-full"
                        />
                        {effectiveMonthly >= maxMonthly && computedMonths > minAchievableMonths - 1 && maxMonthly > 0 && goal.targetAmount / clampedMonthsSlider > maxMonthly && (
                          <p className="text-[11px] text-amber-700 mt-1">
                            Fastest timeline at current leftover cash is {minAchievableMonths} months.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Goal Inline Form */}
            <form onSubmit={handleAddGoal} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  New Savings Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g., House Down Payment"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-900"
                />
              </div>
              <div className="col-span-7 sm:col-span-4">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full text-xs font-mono-num px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-900"
                />
              </div>
              <div className="col-span-5 sm:col-span-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Goal
                </button>
              </div>
            </form>
          </div>

          {/* Leftover Money Investment Vehicle Allocation */}
          <div className="pt-5 border-t border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Leftover Cash Investment Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Remaining unallocated monthly cash:{' '}
                  <span className="font-mono-num font-semibold text-emerald-700">
                    {formatCurrency(remainingForInvestments)}/mo
                  </span>
                </p>
              </div>
              {Math.abs(totalBucketAlloc - 100) > 0.2 && (
                <button
                  type="button"
                  onClick={normalizeBuckets}
                  className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                >
                  Normalize Split ({totalBucketAlloc.toFixed(0)}% → 100%)
                </button>
              )}
            </div>

            {/* Starting Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Starting Taxable / HYSA Balance ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={projectionSettings.startingInvestedBalance || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onChangeProjectionSettings({
                      ...projectionSettings,
                      startingInvestedBalance: Number.isNaN(val) ? 0 : Math.max(0, val),
                    });
                  }}
                  className="w-full text-sm font-mono-num px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Starting 401(k) / Retirement Balance ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={projectionSettings.startingRetirementBalance || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onChangeProjectionSettings({
                      ...projectionSettings,
                      startingRetirementBalance: Number.isNaN(val) ? 0 : Math.max(0, val),
                    });
                  }}
                  className="w-full text-sm font-mono-num px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
                />
              </div>
            </div>

            {/* 4 Investment Buckets */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
              {buckets.map((bucket) => {
                const effectivePct =
                  totalBucketAlloc > 0 ? (bucket.allocationPercent / totalBucketAlloc) * 100 : 0;
                const monthlyDollars = remainingForInvestments * (effectivePct / 100);

                return (
                  <div key={bucket.id} className="py-3 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-12 sm:col-span-5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: bucket.color }}
                        />
                        <span className="text-sm font-medium text-slate-900">{bucket.name}</span>
                      </div>
                      <div className="text-xs font-mono-num text-slate-500 pl-4.5 mt-0.5">
                        {formatCurrency(monthlyDollars)}/mo ({effectivePct.toFixed(0)}% effective)
                      </div>
                    </div>

                    <div className="col-span-7 sm:col-span-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Weight</span>
                        <span className="font-mono-num font-semibold text-slate-800">
                          {bucket.allocationPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        aria-label={`${bucket.name} allocation percentage`}
                        value={bucket.allocationPercent}
                        onChange={(e) => {
                          const nextVal = parseFloat(e.target.value) || 0;
                          onChangeBuckets(
                            buckets.map((b) =>
                              b.id === bucket.id ? { ...b, allocationPercent: nextVal } : b,
                            ),
                          );
                        }}
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-[11px] text-slate-500 mb-0.5 text-right">
                        Expected APY
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          step={0.1}
                          aria-label={`${bucket.name} expected APY`}
                          value={bucket.expectedApy}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChangeBuckets(
                              buckets.map((b) =>
                                b.id === bucket.id
                                  ? { ...b, expectedApy: Number.isNaN(val) ? 0 : Math.max(0, val) }
                                  : b,
                              ),
                            );
                          }}
                          className="w-full text-right font-mono-num text-xs pl-2 pr-5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FIRE Mode Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    FIRE Calculator (Financial Independence, Retire Early)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Plots your target independence line directly onto the wealth projection chart.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={projectionSettings.fireModeEnabled}
                onClick={() =>
                  onChangeProjectionSettings({
                    ...projectionSettings,
                    fireModeEnabled: !projectionSettings.fireModeEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  projectionSettings.fireModeEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                    projectionSettings.fireModeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {projectionSettings.fireModeEnabled && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">Safe Withdrawal Rate</span>
                      <span className="font-mono-num font-semibold text-slate-900">
                        {projectionSettings.safeWithdrawalRate.toFixed(1)}% (
                        {fireMetrics.swrMultiplier.toFixed(1)}×)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3.0}
                      max={5.0}
                      step={0.1}
                      value={projectionSettings.safeWithdrawalRate}
                      onChange={(e) =>
                        onChangeProjectionSettings({
                          ...projectionSettings,
                          safeWithdrawalRate: parseFloat(e.target.value) || 4.0,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Current Age
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={85}
                      value={projectionSettings.currentAge}
                      onChange={(e) =>
                        onChangeProjectionSettings({
                          ...projectionSettings,
                          currentAge: Math.max(18, Math.min(85, parseInt(e.target.value, 10) || 30)),
                        })
                      }
                      className="w-full text-sm font-mono-num px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Coast FIRE Target Age
                    </label>
                    <input
                      type="number"
                      min={projectionSettings.currentAge + 1}
                      max={85}
                      value={projectionSettings.coastTargetAge}
                      onChange={(e) =>
                        onChangeProjectionSettings({
                          ...projectionSettings,
                          coastTargetAge: Math.max(
                            projectionSettings.currentAge + 1,
                            Math.min(85, parseInt(e.target.value, 10) || 65),
                          ),
                        })
                      }
                      className="w-full text-sm font-mono-num px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
                  <div>
                    <div className="text-slate-500">Lean FIRE (Needs Only)</div>
                    <div className="font-mono-num text-sm font-bold text-slate-900 mt-0.5">
                      {formatCurrency(fireMetrics.leanFireNumber)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Standard FIRE (All Expenses)</div>
                    <div className="font-mono-num text-sm font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(fireMetrics.standardFireNumber)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">
                      Coast FIRE (Age {projectionSettings.coastTargetAge})
                    </div>
                    <div className="font-mono-num text-sm font-bold text-slate-900 mt-0.5">
                      {formatCurrency(fireMetrics.coastFireNumber)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
