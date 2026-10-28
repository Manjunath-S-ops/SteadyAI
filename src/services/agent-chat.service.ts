import { generateCommunityGuideFromJson } from '../agents/communityGuide.agent';
import { generateWeeklyHabitReflectionFromJson } from '../agents/habitCoach.agent';
import { generateThreeDayMealPlanFromJson } from '../agents/mealPlanning.agent';

export type AgentChatType = 'MEAL_PLANNER' | 'HABIT_COACH' | 'COMMUNITY_GUIDE';

export interface AgentChatResult {
  text: string;
  reasoning: Array<{ title: string; detail: string }>;
}

function compactPrompt(prompt: string): string {
  return prompt.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function extractFocusTopics(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((x) => x.trim())
    .filter((x) => x.length >= 4)
    .slice(0, 5);
}

function summarizeMealPlan(result: Awaited<ReturnType<typeof generateThreeDayMealPlanFromJson>>): string {
  const titleLine = (result as { planTitle?: string }).planTitle
    ? `Here's your plan: ${(result as { planTitle?: string }).planTitle}.`
    : 'Here\'s your 3-day meal plan.';

  const dayPreviews = result.days
    .map((day) => {
      const meals = day.meals.slice(0, 3);
      const menu = meals.map((m) => m.name).join(', ');
      const totalCals = (day as { totalCalories?: number }).totalCalories
        ?? meals.reduce((s, m) => s + ((m as { calories?: number }).calories ?? 0), 0);
      return `Day ${day.day}: ${menu}${totalCals > 0 ? ` (~${totalCals} cal)` : ''}`;
    })
    .join(' | ');

  const groceryPreview = result.groceryList.slice(0, 6).map((item) => item.item).join(', ');
  const approach = result.reasoning.approach;
  const safetyNote = result.reasoning.safetyNote;

  return `${titleLine} ${approach}\n\n${dayPreviews}.\n\nShopping list highlights: ${groceryPreview}.\n\n${safetyNote}`;
}

function summarizeHabitReflection(result: Awaited<ReturnType<typeof generateWeeklyHabitReflectionFromJson>>): string {
  const reflection = result.weeklyReflection;
  const adjustment = result.habitAdjustment;
  const tip = (result as { contextualTip?: string }).contextualTip ?? '';
  const difficultyLabel = adjustment.difficulty === 'easy' ? 'Easy win' : 'Moderate challenge';
  const minutesHint = (adjustment as { estimatedMinutesPerDay?: number }).estimatedMinutesPerDay
    ? ` (~${(adjustment as { estimatedMinutesPerDay?: number }).estimatedMinutesPerDay} min/day)`
    : '';

  return (
    `${reflection}\n\n` +
    `**Next step — ${adjustment.title}**: ${adjustment.action}\n` +
    `*Why it helps*: ${adjustment.whyItHelps} ${difficultyLabel}${minutesHint}.\n` +
    (tip ? `\n💡 Tip: ${tip}` : '')
  ).trim();
}

function summarizeCommunityGuide(result: Awaited<ReturnType<typeof generateCommunityGuideFromJson>>): string {
  const approach = result.engagementApproach;
  const post = result.suggestedPosts[0];
  const peer = result.suggestedPeers[0];
  const quickWin = (result as { quickWin?: string }).quickWin;

  const postLine = post
    ? `**Post idea — ${post.title}**: ${post.contentPrompt} (${post.reason})`
    : '**Post idea**: Share one small win and one honest challenge from this week.';

  const peerLine = peer
    ? `**Peer connection**: ${peer.outreachPrompt}`
    : '**Peer outreach**: Send one supportive check-in to a community member today.';

  const quickWinLine = quickWin ? `\n\n⚡ Quick win: ${quickWin}` : '';

  return `${approach}\n\n${postLine}\n\n${peerLine}${quickWinLine}`;
}

export async function generateAgentChatReply(agentType: AgentChatType, prompt: string): Promise<AgentChatResult> {
  const normalizedPrompt = compactPrompt(prompt);

  if (!normalizedPrompt) {
    throw new Error('prompt is required');
  }

  if (agentType === 'MEAL_PLANNER') {
    const userSummary = {
      schemaVersion: 'v1',
      generatedAt: new Date().toISOString(),
      userId: 'agent-user',
      profile: {
        onboardingCompleted: true,
        primaryGoal: normalizedPrompt,
        experienceLevel: null,
        dietaryPreferences: [],
        timeAvailability: null
      },
      challengeActivity: {
        activeChallengeId: null,
        participationStatus: null,
        checkIns: {
          total: 0,
          completed: 0,
          partial: 0,
          skipped: 0,
          completionRate: 0,
          lastCheckInAt: null
        }
      },
      communityEngagement: {
        postsCount: 0,
        reactionsGivenCount: 0,
        reactionsReceivedCount: 0,
        lastPostAt: null
      },
      purchaseHistory: {
        totalPurchases: 0,
        totalSpentCents: 0,
        averageOrderValueCents: 0,
        lastPurchaseAt: null,
        topProductIds: []
      },
      safety: {
        piiIncluded: false,
        rawHealthDataIncluded: false
      }
    };

    const result = await generateThreeDayMealPlanFromJson(userSummary);
    return {
      text: summarizeMealPlan(result),
      reasoning: [
        { title: 'Prompt parsed', detail: `Captured planning focus: "${normalizedPrompt}".` },
        { title: 'Approach', detail: result.reasoning.approach },
        { title: 'Days planned', detail: `${result.days.length} days with ${result.days.reduce((s, d) => s + d.meals.length, 0)} meals total.` },
        { title: 'Safety', detail: result.reasoning.safetyNote }
      ]
    };
  }

  if (agentType === 'HABIT_COACH') {
    const summary = {
      challengeId: null,
      participationStatus: 'JOINED',
      periodDays: 7,
      totalCheckIns: 0,
      completedCheckIns: 0,
      partialCheckIns: 0,
      skippedCheckIns: 0,
      completionRate: 0,
      lastCheckInAt: null,
      userNote: normalizedPrompt
    };
    const result = await generateWeeklyHabitReflectionFromJson(summary);
    return {
      text: summarizeHabitReflection(result),
      reasoning: [
        { title: 'Tone', detail: 'Supportive and non-judgmental language applied.' },
        { title: 'Focus', detail: `Weekly adjustment centered around: "${normalizedPrompt}".` },
        { title: 'Actionability', detail: `Suggested difficulty: ${result.habitAdjustment.difficulty}.` },
        { title: 'Encouragement', detail: `Encouragement score: ${(result as { encouragementScore?: number }).encouragementScore ?? 'N/A'}/10` }
      ]
    };
  }

  const engagementSummary = {
    userId: 'agent-user',
    postsCount: 0,
    reactionsGivenCount: 0,
    reactionsReceivedCount: 0,
    lastPostAt: null,
    focusTopics: extractFocusTopics(normalizedPrompt),
    availablePeers: [],
    userQuery: normalizedPrompt
  };
  const result = await generateCommunityGuideFromJson(engagementSummary);

  return {
    text: summarizeCommunityGuide(result),
    reasoning: [
      { title: 'Intent', detail: `Used your context to shape community suggestions: "${normalizedPrompt}".` },
      { title: 'Fairness', detail: 'No popularity ranking was used in recommendations.' },
      { title: 'Quick win', detail: `One fast action identified for immediate engagement.` },
      { title: 'Execution', detail: 'Selected one post prompt and one outreach prompt for low-friction action.' }
    ]
  };
}

