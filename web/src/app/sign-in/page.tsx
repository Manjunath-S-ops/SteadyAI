'use client';

import { useAuth } from '@/auth';
import { resolvePostAuthRedirect, sanitizeAuthRedirect } from '@/auth/routing';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const benefits = [
  'Personalized coaching based on your goals and preferences.',
  'Saved workout, nutrition, and progress history.',
  'A clean handoff into onboarding or your AI coach after login.'
];

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    token,
    isHydrated,
    isAuthenticated,
    isGoogleAuthConfigured,
    isSigningInWithGoogle,
    signInWithGoogle
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const next = useMemo(() => sanitizeAuthRedirect(searchParams.get('next') || '/onboarding'), [searchParams]);

  useEffect(() => {
    let active = true;

    async function routeAuthenticatedUser() {
      if (!isHydrated || !isAuthenticated) {
        return;
      }

      const target = token ? await resolvePostAuthRedirect(token, next) : next;
      if (active) {
        router.replace(target);
      }
    }

    void routeAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isHydrated, next, router, token]);

  function handleGoogleSignIn() {
    setError(null);
    try {
      signInWithGoogle({ redirectTo: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue with Google. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,237,213,0.95),_rgba(246,236,226,0.96)_36%,_#f4efe8_86%)] px-4 pb-[calc(1rem+var(--safe-bottom))] pt-[calc(1rem+var(--safe-top))] text-[#1d140d] dark:bg-[radial-gradient(circle_at_top_left,_rgba(74,55,43,0.82),_rgba(35,25,20,0.96)_42%,_#15100c_86%)] dark:text-[#fff7ed] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100svh-var(--safe-top)-var(--safe-bottom)-2rem)] w-full max-w-5xl items-center gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="order-2 rounded-[32px] border border-white/80 bg-[#fffaf5]/78 p-5 shadow-[0_18px_70px_rgba(80,48,24,0.1)] backdrop-blur dark:border-[#4a372b] dark:bg-[#231914]/82 dark:shadow-[0_18px_70px_rgba(0,0,0,0.3)] sm:p-7 lg:order-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8a4b22] dark:text-[#f3c99f]">Why sign in?</p>
          <h1 className="mt-4 text-4xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-5xl">
            Your health plan should remember you.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5f5145] dark:text-[#d6c2ae]">
            Create an account to save your preferences, complete onboarding, and open your personalized AI coach.
          </p>
          <div className="mt-5 grid gap-3">
            {benefits.map((benefit, index) => (
              <div key={benefit} className="flex items-start gap-3 rounded-[22px] border border-white/80 bg-white/70 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/62">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d140d] text-xs font-bold text-white dark:bg-[#f3c99f] dark:text-[#1d140d]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[#4e4035] dark:text-[#d6c2ae]">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 rounded-[34px] border border-[#e8d7c6] bg-[#1d140d] p-5 text-white shadow-[0_30px_120px_rgba(29,20,13,0.24)] dark:border-[#4a372b] dark:bg-[#0f0b08] sm:p-7 lg:order-2 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f3c99f]">Account access</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em]">Welcome to SteadyAI</h2>
              </div>
              <Link href="/" className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-[#f3e7da] hover:bg-white/10 transition">
                Home
              </Link>
            </div>

            <p className="mt-6 text-sm leading-6 text-[#d8c0ad]">
              We use secure, single sign-on authentication so you never have to remember another password. Sign in or create your account instantly using Google.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {error ? (
              <p className="rounded-[18px] border border-[#ffb4ab]/30 bg-[#3b1714] px-4 py-3 text-sm leading-6 text-[#ffdad6]">
                {error}
              </p>
            ) : null}

            {isGoogleAuthConfigured ? (
              <button
                id="sign-in-with-google"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInWithGoogle}
                className="min-h-14 w-full rounded-full bg-white px-5 py-4 text-base font-bold text-[#1d140d] hover:bg-[#f7efe6] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3 shadow-[0_12px_30px_rgba(255,255,255,0.05)]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isSigningInWithGoogle ? 'Redirecting to Google...' : 'Continue with Google'}
              </button>
            ) : (
              <p className="rounded-[18px] border border-[#ffb4ab]/30 bg-[#3b1714] px-4 py-3 text-sm leading-6 text-[#ffdad6]">
                Authentication is not configured yet. Add the Google Client ID to enable access.
              </p>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-[#9e8a7b]">
            By continuing, you agree to SteadyAI&apos;s{' '}
            <Link href="/terms" className="underline hover:text-white transition">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="underline hover:text-white transition">Privacy Policy</Link>.
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7efe6] dark:bg-[#15100c]" />}>
      <SignInPageContent />
    </Suspense>
  );
}
