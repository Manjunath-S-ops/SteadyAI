export interface CommunityPeerProfile {
  peerUserId: string;
  sharedContext?: string;
}

export interface McpCommunityEngagementSummaryInput {
  userId: string;
  postsCount: number;
  reactionsGivenCount: number;
  reactionsReceivedCount: number;
  lastPostAt: string | null;
  focusTopics?: string[];
  availablePeers?: CommunityPeerProfile[];
  /** Active challenge context if the user is in a challenge */
  challengeContext?: {
    challengeId: string | null;
    completionRate: number;
    periodDays: number;
  } | null;
  /** The user's message/query for personalization */
  userQuery?: string;
}

export const COMMUNITY_GUIDE_SCHEMA_VERSION = 'v1';

export function buildCommunityGuidePrompt(input: McpCommunityEngagementSummaryInput): string {
  const activityLevel = input.postsCount === 0
    ? 'new or inactive member'
    : input.postsCount < 5
    ? 'occasional contributor'
    : 'active community member';

  const queryContext = input.userQuery
    ? `The user asked: "${input.userQuery}". Tailor your suggestions to this request.`
    : '';

  const challengeInfo = input.challengeContext?.challengeId
    ? `User is in an active challenge with ${Math.round((input.challengeContext.completionRate ?? 0) * 100)}% completion rate.`
    : 'User is not currently in an active challenge.';

  return [
    'You are a community engagement coach for a wellness app.',
    `The user is a ${activityLevel} (${input.postsCount} posts, ${input.reactionsGivenCount} reactions given).`,
    challengeInfo,
    queryContext,
    'Generate 2-3 practical, specific, encouraging suggestions to help this user engage authentically.',
    '',
    'Rules:',
    '- Return strict JSON only — no markdown, no code fences.',
    '- Do not rank members by popularity or follower count.',
    '- Do not reference likes, follower counts, or "top users".',
    '- Suggested post content must be specific, not generic ("Share your experience" is too vague).',
    '- Peer outreach prompts should feel personal and warm, not transactional.',
    '- Use neutral, encouraging language throughout.',
    '',
    'Output schema:',
    '{',
    '  "schemaVersion": "v1",',
    '  "engagementApproach": "1-2 sentence strategy tailored to this user\'s activity level and goals",',
    '  "suggestedPosts": [',
    '    {',
    '      "title": "Specific post title (not generic)",',
    '      "contentPrompt": "Detailed prompt the user can use verbatim or adapt",',
    '      "postType": "WIN|QUESTION|CHECK_IN",',
    '      "reason": "Why this post would resonate with the community"',
    '    }',
    '  ],',
    '  "suggestedPeers": [',
    '    {',
    '      "peerUserId": "string",',
    '      "outreachPrompt": "Specific message template the user can send",',
    '      "reason": "What they have in common or why connecting makes sense"',
    '    }',
    '  ],',
    '  "quickWin": "One simple action the user can take in the next 5 minutes to engage"',
    '}',
    `Full input context: ${JSON.stringify(input)}`
  ].join('\n');
}

