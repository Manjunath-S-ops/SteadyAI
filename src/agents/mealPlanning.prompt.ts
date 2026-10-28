import type { McpUserSummary } from '../mcp/userSummary';

export const MEAL_PLAN_SCHEMA_VERSION = 'v1';

export function buildMealPlanningPrompt(userSummary: McpUserSummary): string {
  const summaryJson = JSON.stringify(userSummary);
  const goal = userSummary.profile?.primaryGoal ?? 'balanced wellness';
  const dietary = Array.isArray(userSummary.profile?.dietaryPreferences) && userSummary.profile.dietaryPreferences.length > 0
    ? `Dietary constraints: ${userSummary.profile.dietaryPreferences.join(', ')}.`
    : 'No specific dietary restrictions.';

  return [
    'You are an expert meal planning assistant for a wellness app.',
    `User goal: ${goal}.`,
    dietary,
    'Create a practical, varied 3-day meal plan with a full grocery list.',
    'Base all suggestions on the user context provided. Make lifestyle-friendly, non-medical suggestions.',
    'Use warm, encouraging language throughout.',
    '',
    'Hard requirements:',
    '- Return strict JSON only — no markdown, no code fences, no comments, no extra keys.',
    '- Exactly 3 day objects with day values 1, 2, 3.',
    '- Each day must have exactly 4 meal slots: breakfast, lunch, dinner, snack.',
    '- Each meal must include: name, portion, calories (number), proteinG (number), carbsG (number), fiberG (number), and a brief reason.',
    '- Calories should be realistic (breakfast 300-500, lunch 400-600, dinner 450-650, snack 100-250).',
    '- Include reasoning as plain lifestyle rationale only — no medical advice.',
    '- Keep output compact and deterministic in structure.',
    '',
    'Output JSON schema:',
    '{',
    '  "schemaVersion": "v1",',
    '  "planTitle": "string",',
    '  "days": [',
    '    {',
    '      "day": 1,',
    '      "totalCalories": number,',
    '      "meals": [',
    '        {',
    '          "slot": "breakfast|lunch|dinner|snack",',
    '          "name": "string",',
    '          "portion": "string",',
    '          "calories": number,',
    '          "proteinG": number,',
    '          "carbsG": number,',
    '          "fiberG": number,',
    '          "reason": "1 sentence lifestyle rationale"',
    '        }',
    '      ]',
    '    }',
    '  ],',
    '  "groceryList": [',
    '    { "item": "string", "quantity": "string", "category": "produce|protein|grains|dairy|pantry|other" }',
    '  ],',
    '  "reasoning": {',
    '    "approach": "string",',
    '    "constraintsApplied": ["string"],',
    '    "safetyNote": "string"',
    '  }',
    '}',
    `User context: ${summaryJson}`
  ].join('\n');
}

