'use client';

import { useState } from 'react';

function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25) return { label: 'Normal weight', color: 'text-green-500' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' };
  return { label: 'Obese', color: 'text-red-500' };
}

export function BmiCalculatorCard() {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  function calculate() {
    let h: number, w: number;
    if (unit === 'metric') {
      h = parseFloat(heightCm) / 100;
      w = parseFloat(weightKg);
    } else {
      const totalInches = parseFloat(heightFt) * 12 + parseFloat(heightIn || '0');
      h = totalInches * 0.0254;
      w = parseFloat(weightLbs) * 0.453592;
    }
    if (!h || !w || h <= 0 || w <= 0) return;
    setBmi(parseFloat((w / (h * h)).toFixed(1)));
  }

  const category = bmi ? getBmiCategory(bmi) : null;

  return (
    <section className="rounded-[32px] border border-white/80 bg-[#fffaf5]/82 p-4 shadow-[0_18px_60px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#ef4444] text-white text-lg font-bold">
          BMI
        </div>
        <div>
          <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#1d140d] dark:text-[#fff7ed]">BMI Calculator</h3>
          <p className="text-sm text-[#5f5145] dark:text-[#d6c2ae]">Body Mass Index estimator</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {/* Unit Toggle */}
        <div className="flex rounded-2xl border border-[#ead9ca] bg-white/60 p-1 dark:border-[#4a372b] dark:bg-[#15100c]">
          {(['metric', 'imperial'] as const).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => { setUnit(u); setBmi(null); }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition ${
                unit === u
                  ? 'bg-[#1d140d] text-white dark:bg-[#f3c99f] dark:text-[#1d140d]'
                  : 'text-[#5f5145] dark:text-[#d6c2ae]'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {unit === 'metric' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-white/80 bg-white/72 p-3 dark:border-[#4a372b] dark:bg-[#15100c]/72">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Height (cm)</label>
              <input id="bmi-height-cm" type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="170" className="mt-2 w-full rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]" />
            </div>
            <div className="rounded-[20px] border border-white/80 bg-white/72 p-3 dark:border-[#4a372b] dark:bg-[#15100c]/72">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Weight (kg)</label>
              <input id="bmi-weight-kg" type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="70" className="mt-2 w-full rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] border border-white/80 bg-white/72 p-3 dark:border-[#4a372b] dark:bg-[#15100c]/72">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Feet</label>
              <input id="bmi-height-ft" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="5" className="mt-2 w-full rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]" />
            </div>
            <div className="rounded-[20px] border border-white/80 bg-white/72 p-3 dark:border-[#4a372b] dark:bg-[#15100c]/72">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Inches</label>
              <input id="bmi-height-in" type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="7" className="mt-2 w-full rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]" />
            </div>
            <div className="rounded-[20px] border border-white/80 bg-white/72 p-3 dark:border-[#4a372b] dark:bg-[#15100c]/72">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Lbs</label>
              <input id="bmi-weight-lbs" type="number" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} placeholder="154" className="mt-2 w-full rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]" />
            </div>
          </div>
        )}

        <button
          id="calculate-bmi-btn"
          type="button"
          onClick={calculate}
          className="w-full rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#ef4444] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
        >
          Calculate BMI
        </button>

        {bmi !== null && category && (
          <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 text-center dark:border-[#4a372b] dark:bg-[#15100c]/72">
            <p className="text-4xl font-bold text-[#1d140d] dark:text-[#fff7ed]">{bmi}</p>
            <p className={`mt-1 text-lg font-semibold ${category.color}`}>{category.label}</p>
            <div className="mt-3 grid grid-cols-4 gap-1 text-center text-xs">
              {[['< 18.5', 'Underweight', 'bg-blue-100 dark:bg-blue-900/30'],
                ['18.5–24.9', 'Normal', 'bg-green-100 dark:bg-green-900/30'],
                ['25–29.9', 'Overweight', 'bg-yellow-100 dark:bg-yellow-900/30'],
                ['≥ 30', 'Obese', 'bg-red-100 dark:bg-red-900/30']].map(([range, label, cls]) => (
                <div key={label} className={`rounded-xl p-2 ${cls}`}>
                  <p className="font-bold text-[#1d140d] dark:text-white">{range}</p>
                  <p className="text-[#5f5145] dark:text-[#d6c2ae]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#9e8c80] dark:text-[#7a6255]">BMI is a screening tool, not a diagnostic measure. Consult a clinician for health guidance.</p>
          </div>
        )}
      </div>
    </section>
  );
}
