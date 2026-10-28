'use client';

import type { PlatformContext } from '@/lib/api';

export function ProfileCard({ context }: { context: PlatformContext }) {
  const { userIdentity } = context;

  const initials = (userIdentity.displayName || userIdentity.email || 'S')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const experienceColors: Record<string, string> = {
    beginner: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    advanced: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  };

  const expLevel = (userIdentity as { experienceLevel?: string }).experienceLevel?.toLowerCase() ?? '';
  const expColor = experienceColors[expLevel] ?? 'bg-[#f3e7da] text-[#7a4b28] dark:bg-[#3a2519] dark:text-[#f3c99f]';
  const dietaryPrefs = (userIdentity as { dietaryPreferences?: string[] }).dietaryPreferences ?? [];
  const primaryGoal = (userIdentity as { primaryGoal?: string }).primaryGoal;

  return (
    <section className="rounded-[32px] border border-white/80 bg-[#fffaf5]/82 p-4 shadow-[0_18px_60px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a4b22] to-[#c47b3a] text-base font-bold text-white">
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#1d140d] dark:text-[#fff7ed]">Account Profile</h3>
          <p className="text-sm text-[#5f5145] dark:text-[#d6c2ae]">Your SteadyAI identity</p>
        </div>
        {userIdentity.onboardingCompleted && (
          <span className="shrink-0 rounded-xl bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            ✓ Onboarded
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ProfileItem label="Display Name" value={userIdentity.displayName || 'Not set'} />
        <ProfileItem label="Email" value={userIdentity.email || 'Not set'} />

        {primaryGoal && (
          <div className="sm:col-span-2 rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Primary Goal</p>
            <p className="mt-2 break-words text-base font-semibold text-[#4e4035] dark:text-[#fff7ed]">{primaryGoal}</p>
          </div>
        )}

        {expLevel && (
          <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Experience Level</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${expColor}`}>
              {expLevel}
            </span>
          </div>
        )}

        {dietaryPrefs.length > 0 && (
          <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Dietary Preferences</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dietaryPrefs.map((pref: string) => (
                <span key={pref} className="rounded-full bg-[#f3e7da] px-2.5 py-0.5 text-xs font-semibold text-[#7a4b28] dark:bg-[#3a2519] dark:text-[#f3c99f]">
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">{label}</p>
      <p className="mt-2 break-words text-base font-semibold text-[#4e4035] dark:text-[#fff7ed]">{value}</p>
    </div>
  );
}

