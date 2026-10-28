'use client';

import { useEffect, useState } from 'react';

interface ApiKeysCardProps {
  token: string | null;
}

interface ApiKeyStatus {
  hasGeminiKey: boolean;
  hasGroqKey: boolean;
  geminiApiKeyMasked: string | null;
  groqApiKeyMasked: string | null;
  updatedAt: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export function ApiKeysCard({ token }: ApiKeysCardProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      if (!token) { setLoadingStatus(false); return; }
      try {
        const res = await fetch(`${API_BASE}/api/user/api-keys`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // silently fail — user can still enter keys
      } finally {
        setLoadingStatus(false);
      }
    }
    loadStatus();
  }, [token]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, string | null> = {};
      if (geminiKey.trim()) body.geminiApiKey = geminiKey.trim();
      if (groqKey.trim()) body.groqApiKey = groqKey.trim();
      const res = await fetch(`${API_BASE}/api/user/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to save API keys');
      setSaved(true);
      setGeminiKey('');
      setGroqKey('');
      // Refresh status
      const refreshed = await fetch(`${API_BASE}/api/user/api-keys`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (refreshed.ok) setStatus(await refreshed.json());
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearKey(keyType: 'gemini' | 'groq') {
    if (!token) return;
    try {
      const body = keyType === 'gemini' ? { geminiApiKey: '' } : { groqApiKey: '' };
      await fetch(`${API_BASE}/api/user/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              ...(keyType === 'gemini'
                ? { hasGeminiKey: false, geminiApiKeyMasked: null }
                : { hasGroqKey: false, groqApiKeyMasked: null })
            }
          : prev
      );
    } catch {
      setError('Failed to clear key');
    }
  }

  const formattedDate = status?.updatedAt
    ? new Date(status.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <section className="rounded-[32px] border border-white/80 bg-[#fffaf5]/82 p-4 shadow-[0_18px_60px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#3b82f6] text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#1d140d] dark:text-[#fff7ed]">AI API Keys</h3>
          <p className="text-sm text-[#5f5145] dark:text-[#d6c2ae]">Use your own Gemini or Groq key for AI features</p>
        </div>
        {formattedDate && (
          <span className="shrink-0 rounded-xl bg-[#f3e7da] px-2 py-1 text-[10px] font-semibold text-[#7a4b28] dark:bg-[#3a2519] dark:text-[#f3c99f]">
            Updated {formattedDate}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Gemini Key */}
        <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">
              Gemini API Key
            </label>
            {!loadingStatus && status?.hasGeminiKey && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <span>✓</span> Active
                </span>
                <button
                  type="button"
                  onClick={() => handleClearKey('gemini')}
                  className="text-[10px] font-semibold text-red-400 hover:text-red-600 dark:text-red-400"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {!loadingStatus && status?.hasGeminiKey && status.geminiApiKeyMasked && (
            <p className="mt-1.5 font-mono text-xs text-[#9e8c80] dark:text-[#7a6255]">
              Current: {status.geminiApiKeyMasked}
            </p>
          )}
          <p className="mt-1 text-xs text-[#7a6555] dark:text-[#a89280]">
            {status?.hasGeminiKey ? 'Enter a new key to replace the current one · ' : 'Get it from '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">
              Google AI Studio
            </a>
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id="gemini-api-key"
              type={showGemini ? 'text' : 'password'}
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder={status?.hasGeminiKey ? 'Enter new key to replace...' : 'Paste your Gemini API key...'}
              className="flex-1 rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] placeholder-[#b89d8a] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]"
            />
            <button
              type="button"
              onClick={() => setShowGemini(v => !v)}
              className="shrink-0 rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-xs font-semibold text-[#5f5145] hover:bg-[#f3e7da] dark:border-[#4a372b] dark:bg-[#231914] dark:text-[#d6c2ae]"
            >
              {showGemini ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Groq Key */}
        <div className="rounded-[20px] border border-white/80 bg-white/72 p-4 dark:border-[#4a372b] dark:bg-[#15100c]/72">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a4b28] dark:text-[#f3c99f]">
              Groq API Key
            </label>
            {!loadingStatus && status?.hasGroqKey && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <span>✓</span> Active
                </span>
                <button
                  type="button"
                  onClick={() => handleClearKey('groq')}
                  className="text-[10px] font-semibold text-red-400 hover:text-red-600 dark:text-red-400"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {!loadingStatus && status?.hasGroqKey && status.groqApiKeyMasked && (
            <p className="mt-1.5 font-mono text-xs text-[#9e8c80] dark:text-[#7a6255]">
              Current: {status.groqApiKeyMasked}
            </p>
          )}
          <p className="mt-1 text-xs text-[#7a6555] dark:text-[#a89280]">
            {status?.hasGroqKey ? 'Enter a new key to replace the current one · ' : 'Get it from '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline">
              Groq Console
            </a>
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id="groq-api-key"
              type={showGroq ? 'text' : 'password'}
              value={groqKey}
              onChange={e => setGroqKey(e.target.value)}
              placeholder={status?.hasGroqKey ? 'Enter new key to replace...' : 'Paste your Groq API key...'}
              className="flex-1 rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-sm text-[#1d140d] placeholder-[#b89d8a] outline-none focus:border-[#7a4b28] dark:border-[#4a372b] dark:bg-[#1d140d] dark:text-[#fff7ed]"
            />
            <button
              type="button"
              onClick={() => setShowGroq(v => !v)}
              className="shrink-0 rounded-xl border border-[#ead9ca] bg-white/80 px-3 py-2 text-xs font-semibold text-[#5f5145] hover:bg-[#f3e7da] dark:border-[#4a372b] dark:bg-[#231914] dark:text-[#d6c2ae]"
            >
              {showGroq ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
        )}
        {saved && (
          <p className="rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">✓ API keys saved successfully!</p>
        )}

        <button
          id="save-api-keys-btn"
          type="button"
          onClick={handleSave}
          disabled={saving || (!geminiKey.trim() && !groqKey.trim())}
          className="w-full rounded-2xl bg-gradient-to-r from-[#6c47ff] to-[#3b82f6] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save API Keys'}
        </button>

        <p className="text-center text-xs text-[#9e8c80] dark:text-[#7a6255]">
          Keys are encrypted at rest and used only for your AI requests. Never share your keys publicly.
        </p>
      </div>
    </section>
  );
}

