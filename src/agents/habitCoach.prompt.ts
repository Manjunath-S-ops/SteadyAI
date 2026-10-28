export interface ChallengeParticipationSummary {
  challengeId: string | null;
  participationStatus: string | null;
  periodDays: number;
  totalCheckIns: number;
  completedCheckIns: number;
  partialCheckIns: number;
  skippedCheckIns: number;
  completionRate: number;
  lastCheckInAt: string | null;
  /** The user's actual message or question — use this to personalize the reflection */
  userNote?: string;
}

export const HABIT_COACH_SCHEMA_VERSION = 'v1';

export function buildHabitCoachPrompt(summary: ChallengeParticipationSummary): string {
  const userContext = summary.userNote
    ? `The user said: "${summary.userNote}". Address this directly in your reflection.`
    : '';
  const checkInRate = summary.periodDays > 0
    ? `${summary.completedCheckIns} of ${summary.totalCheckIns} check-ins completed (${Math.round(summary.completionRate * 100)}% completion rate over ${summary.periodDays} days).`
    : 'No check-in data available yet.';

  return [
    'You are a supportive, knowledgeable habit coach for a wellness app.',
    'Your role is to help users build sustainable habits through compassionate guidance.',
    userContext,
    'Write a personalized weekly reflection based on the user\'s check-in data.',
    'Then suggest exactly one specific, actionable habit adjustment.',
    'Rules:',
    '- Use warm, encouraging language — never shame or criticize.',
    '- Make the weekly reflection 2-3 sentences that acknowledge both wins AND challenges.',
    '- The habit adjustment must be concrete and immediately actionable today.',
    '- Do not provide medical advice, diagnosis, or treatment recommendations.',
    '- Return strict JSON only — no markdown, no extra keys, no code fences.',
    `User stats: ${checkInRate}`,
    'Required JSON output schema:',
    '{',
    '  "schemaVersion": "v1",',
    '  "weeklyReflection": "2-3 sentences acknowledging progress and challenges with warmth",',
    '  "habitAdjustment": {',
    '    "title": "Short action title (max 8 words)",',
    '    "action": "Specific step the user can take today or this week",',
    '    "whyItHelps": "Brief explanation of the benefit (1-2 sentences)",',
    '    "difficulty": "easy|moderate",',
    '    "estimatedMinutesPerDay": number,',
    '    "nextCheckInDays": number',
    '  },',
    '  "encouragementScore": number_0_to_10,',
    '  "contextualTip": "One practical tip relevant to the user\'s current streak or pattern",',
    '  "toneCheck": {',
    '    "supportive": true,',
    '    "nonJudgmental": true,',
    '    "noShamingLanguage": true',
    '  }',
    '}',
    `Full input summary: ${JSON.stringify(summary)}`
  ].join('\n');
}

