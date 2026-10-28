import Link from 'next/link';

export function LegalLinksCard() {
  return (
    <section className="rounded-[32px] border border-white/80 bg-[#fffaf5]/82 p-4 shadow-[0_18px_60px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3e7da] dark:bg-[#3a2519]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a4b28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#1d140d] dark:text-[#fff7ed]">Legal</h3>
          <p className="text-sm text-[#5f5145] dark:text-[#d6c2ae]">Policies &amp; information</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/privacy"
          className="group rounded-[20px] border border-white/80 bg-white/72 p-4 transition hover:bg-[#f3e7da] dark:border-[#4a372b] dark:bg-[#15100c]/72 dark:hover:bg-[#2b2018]"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Privacy Policy</p>
          <p className="mt-2 flex items-center justify-between text-base font-semibold text-[#4e4035] dark:text-[#fff7ed]">
            <span>View policy</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 transition group-hover:opacity-60">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </p>
        </Link>

        <Link
          href="/terms"
          className="group rounded-[20px] border border-white/80 bg-white/72 p-4 transition hover:bg-[#f3e7da] dark:border-[#4a372b] dark:bg-[#15100c]/72 dark:hover:bg-[#2b2018]"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">Terms of Service</p>
          <p className="mt-2 flex items-center justify-between text-base font-semibold text-[#4e4035] dark:text-[#fff7ed]">
            <span>View terms</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 transition group-hover:opacity-60">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </p>
        </Link>

        <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">App Version</p>
          <p className="mt-2 text-base font-semibold text-[#4e4035] dark:text-[#fff7ed]">SteadyAI v0.1.0</p>
        </div>
      </div>
    </section>
  );
}
