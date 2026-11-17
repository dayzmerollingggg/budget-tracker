import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  BonusFrequency,
  DeductionTaxType,
  DeductionUnit,
  FilingMode,
  HouseholdTaxSummary,
  IncomeStream,
  PayrollDeduction,
  PersonIncomeProfile,
  TaxLocationConfig,
} from '../types/finance';
import { formatCurrency } from '../utils/financeMath';
import {
  CITY_LOCAL_TAX_OPTIONS,
  FEDERAL_STANDARD_DEDUCTION_2026,
  US_STATES,
} from '../utils/taxEngine';

interface IncomePanelProps {
  filingMode: FilingMode;
  personA: PersonIncomeProfile;
  personB: PersonIncomeProfile;
  location: TaxLocationConfig;
  taxSummary: HouseholdTaxSummary;
  onChangePersonA: (next: PersonIncomeProfile) => void;
  onChangePersonB: (next: PersonIncomeProfile) => void;
  onChangeLocation: (next: TaxLocationConfig) => void;
}

interface PersonProfileEditorProps {
  profile: PersonIncomeProfile;
  onChange: (next: PersonIncomeProfile) => void;
}

const PersonProfileEditor: React.FC<PersonProfileEditorProps> = ({ profile, onChange }) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTaxType, setCustomTaxType] = useState<DeductionTaxType>('pre_tax');
  const [customUnit, setCustomUnit] = useState<DeductionUnit>('dollar_per_paycheck');
  const [customValue, setCustomValue] = useState<string>('50');

  const updateSalary = (val: string) => {
    const parsed = parseFloat(val);
    onChange({ ...profile, annualSalary: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) });
  };

  const addBonus = () => {
    const newBonus: IncomeStream = {
      id: `bonus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Bonus / Subsidy',
      amount: 0,
      frequency: 'annual',
      isTaxable: true,
    };
    onChange({ ...profile, bonuses: [...profile.bonuses, newBonus] });
  };

  const updateBonus = (id: string, patch: Partial<IncomeStream>) => {
    onChange({
      ...profile,
      bonuses: profile.bonuses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const removeBonus = (id: string) => {
    onChange({
      ...profile,
      bonuses: profile.bonuses.filter((b) => b.id !== id),
    });
  };

  const updateDeduction = (id: string, patch: Partial<PayrollDeduction>) => {
    onChange({
      ...profile,
      deductions: profile.deductions.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  };

  const removeDeduction = (id: string) => {
    onChange({
      ...profile,
      deductions: profile.deductions.filter((d) => d.id !== id),
    });
  };

  const handleAddCustomDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    const numericVal = parseFloat(customValue);
    const nextDed: PayrollDeduction = {
      id: `ded-custom-${Date.now()}`,
      name: trimmed,
      taxType: customTaxType,
      unit: customUnit,
      value: Number.isNaN(numericVal) ? 0 : Math.max(0, numericVal),
      enabled: true,
      isCustom: true,
    };
    onChange({
      ...profile,
      deductions: [...profile.deductions, nextDed],
    });
    setCustomName('');
    setCustomValue('50');
    setShowCustomForm(false);
  };

  const preTaxDeductions = profile.deductions.filter((d) => d.taxType === 'pre_tax');
  const postTaxDeductions = profile.deductions.filter((d) => d.taxType === 'post_tax');

  const renderDeductionRow = (d: PayrollDeduction) => (
    <div key={d.id} className="py-2.5 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
          <input
            type="checkbox"
            checked={d.enabled}
            onChange={(e) => updateDeduction(d.id, { enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className={`text-sm font-medium truncate ${d.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
            {d.name}
          </span>
        </label>

        <div className="flex items-center gap-1.5 shrink-0">
          <select
            aria-label={`${d.name} unit`}
            value={d.unit}
            onChange={(e) => updateDeduction(d.id, { unit: e.target.value as DeductionUnit })}
            disabled={!d.enabled}
            className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-slate-50 text-slate-700 disabled:opacity-50"
          >
            <option value="percent">% Salary</option>
            <option value="dollar_per_paycheck">$ / Check</option>
          </select>

          <div className="relative w-24">
            <input
              type="number"
              min={0}
              step={d.unit === 'percent' ? 0.5 : 10}
              aria-label={`${d.name} amount`}
              value={d.value || ''}
              placeholder="0"
              disabled={!d.enabled}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                updateDeduction(d.id, {
                  value: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
                  enabled: true,
                });
              }}
              className="w-full text-right font-mono-num text-sm border border-slate-200 rounded-md pl-2 pr-6 py-1 text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              {d.unit === 'percent' ? '%' : '$'}
            </span>
          </div>

          {d.isCustom && (
            <button
              type="button"
              onClick={() => removeDeduction(d.id)}
              aria-label={`Remove ${d.name}`}
              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {d.id === 'ded-401k' && d.enabled && (
        <div className="mt-2 pl-6 flex items-center justify-between gap-2 text-xs text-slate-600">
          <span>Employer 401(k) Match (% of salary)</span>
          <div className="relative w-20">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              aria-label="Employer Match Percentage"
              value={d.employerMatchPercent ?? ''}
              placeholder="0"
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                updateDeduction(d.id, {
                  employerMatchPercent: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
                });
              }}
              className="w-full text-right font-mono-num text-xs border border-slate-200 rounded-md pl-2 pr-5 py-1 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">%</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700">
            {profile.label} — Annual Base Salary
          </label>
          <span className="text-xs text-slate-500 font-mono-num">
            {formatCurrency(profile.annualSalary / 12)}/mo
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono-num text-sm">$</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={profile.annualSalary || ''}
            placeholder="0"
            onChange={(e) => updateSalary(e.target.value)}
            className="w-full pl-7 pr-3 py-2 text-sm font-mono-num font-medium text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Bonuses & Subsidies */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Bonuses & Subsidies</span>
          <button
            type="button"
            onClick={addBonus}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stream
          </button>
        </div>

        {profile.bonuses.length === 0 ? (
          <p className="text-xs text-slate-400 py-1">No extra bonuses or employer subsidies added.</p>
        ) : (
          <div className="space-y-2">
            {profile.bonuses.map((bonus) => (
              <div key={bonus.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2 rounded-lg border border-slate-200/80">
                <input
                  type="text"
                  value={bonus.name}
                  aria-label="Bonus name"
                  onChange={(e) => updateBonus(bonus.id, { name: e.target.value })}
                  placeholder="Stream name"
                  className="col-span-12 sm:col-span-4 text-xs px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
                />
                <div className="col-span-5 sm:col-span-3 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    aria-label="Bonus amount"
                    value={bonus.amount || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateBonus(bonus.id, { amount: Number.isNaN(val) ? 0 : Math.max(0, val) });
                    }}
                    className="w-full pl-5 pr-2 py-1.5 text-xs font-mono-num border border-slate-200 rounded bg-white text-slate-900"
                  />
                </div>
                <select
                  aria-label="Bonus frequency"
                  value={bonus.frequency}
                  onChange={(e) => updateBonus(bonus.id, { frequency: e.target.value as BonusFrequency })}
                  className="col-span-4 sm:col-span-2 text-xs px-1.5 py-1.5 border border-slate-200 rounded bg-white text-slate-700"
                >
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                </select>
                <div className="col-span-3 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateBonus(bonus.id, { isTaxable: !bonus.isTaxable })}
                    title="Toggle Taxable vs Tax-Free Subsidy"
                    className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap ${
                      bonus.isTaxable
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {bonus.isTaxable ? 'Taxable' : 'Tax-Free'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBonus(bonus.id)}
                    aria-label={`Remove ${bonus.name}`}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payroll Deductions */}
      <div className="pt-3 border-t border-slate-100 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-700">Pre-Tax Payroll Deductions</span>
            <span className="text-[11px] text-slate-400">26 paychecks/yr</span>
          </div>
          <div>{preTaxDeductions.map(renderDeductionRow)}</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-700">Post-Tax Payroll Deductions</span>
            <span className="text-[11px] text-slate-400">Deducted after tax</span>
          </div>
          <div>{postTaxDeductions.map(renderDeductionRow)}</div>
        </div>

        {!showCustomForm ? (
          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Deduction
          </button>
        ) : (
          <form onSubmit={handleAddCustomDeduction} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="text-xs font-semibold text-slate-800">New Custom Deduction</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="e.g., Union Dues, ESPP"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
              />
              <select
                value={customTaxType}
                onChange={(e) => setCustomTaxType(e.target.value as DeductionTaxType)}
                className="text-xs px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-700"
              >
                <option value="pre_tax">Pre-Tax</option>
                <option value="post_tax">Post-Tax</option>
              </select>
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as DeductionUnit)}
                className="text-xs px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-700"
              >
                <option value="dollar_per_paycheck">$ per Paycheck</option>
                <option value="percent">% of Salary</option>
              </select>
              <input
                type="number"
                min={0}
                step={0.5}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="text-xs font-mono-num px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-900"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
              >
                Save Deduction
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const IncomePanel: React.FC<IncomePanelProps> = ({
  filingMode,
  personA,
  personB,
  location,
  taxSummary,
  onChangePersonA,
  onChangePersonB,
  onChangeLocation,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section id="income-tax" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            01. Income, Deductions & 2026 Tax Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Gross {formatCurrency(taxSummary.totalGrossIncome + taxSummary.totalTaxFreeSubsidies)}/yr
            <span className="mx-1.5">·</span>
            Effective Tax {taxSummary.effectiveTaxRate.toFixed(1)}%
            <span className="mx-1.5">·</span>
            Net {formatCurrency(taxSummary.monthlyNetTakeHome)}/mo
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
          {/* Location-Based Tax Estimator */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-800">
                2026 Location Tax Estimator
              </h3>
              <span className="text-xs text-slate-500 font-mono-num">
                Std. Deduction: {formatCurrency(FEDERAL_STANDARD_DEDUCTION_2026[filingMode])} ({filingMode === 'joint' ? 'MFJ' : 'Single'})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  US State (50 States + DC)
                </label>
                <select
                  value={location.stateCode}
                  onChange={(e) => onChangeLocation({ ...location, stateCode: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                >
                  {US_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.type === 'none' ? '0% Income Tax' : st.type === 'flat' ? 'Flat' : 'Progressive'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  City / Local Income Tax
                </label>
                <select
                  value={location.cityId}
                  onChange={(e) => onChangeLocation({ ...location, cityId: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                >
                  {CITY_LOCAL_TAX_OPTIONS.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {location.cityId === 'custom' && (
              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="text-xs font-medium text-slate-700">
                  Custom Local / Municipal Tax Rate (%)
                </label>
                <div className="relative w-28">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.1}
                    value={location.customLocalRate || ''}
                    placeholder="0.0"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onChangeLocation({
                        ...location,
                        customLocalRate: Number.isNaN(val) ? 0 : Math.max(0, Math.min(20, val)),
                      });
                    }}
                    className="w-full text-right font-mono-num text-sm border border-slate-200 rounded-lg pl-2 pr-6 py-1.5 bg-white text-slate-900"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>
            )}

            {/* Compact Tax Ledger Line */}
            <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-slate-500">Federal Tax</div>
                <div className="font-mono-num font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(taxSummary.federalIncomeTax)}/yr
                </div>
              </div>
              <div>
                <div className="text-slate-500">State Tax</div>
                <div className="font-mono-num font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(taxSummary.stateIncomeTax)}/yr
                </div>
              </div>
              <div>
                <div className="text-slate-500">Local Tax</div>
                <div className="font-mono-num font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(taxSummary.localIncomeTax)}/yr
                </div>
              </div>
              <div>
                <div className="text-slate-500">FICA (SS + Med)</div>
                <div className="font-mono-num font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(taxSummary.totalFicaTax)}/yr
                </div>
              </div>
            </div>
          </div>

          {/* Person A & Side-by-Side Person B */}
          <div className={filingMode === 'joint' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : ''}>
            <div className={filingMode === 'joint' ? 'xl:pr-4 xl:border-r xl:border-slate-100' : ''}>
              <PersonProfileEditor profile={personA} onChange={onChangePersonA} />
            </div>

            {filingMode === 'joint' && (
              <div className="pt-4 border-t border-slate-200 xl:pt-0 xl:border-t-0">
                <PersonProfileEditor profile={personB} onChange={onChangePersonB} />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
