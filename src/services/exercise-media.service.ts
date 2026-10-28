import { getPrismaClient } from '../db/prisma';

type ExerciseMediaTarget = {
  name: string;
  thumbnailLabel?: string;
  mediaUrl?: string;
  mediaType?: 'GIF' | 'MP4' | 'IMAGE' | 'NONE';
  gifUrl?: string;
  videoUrl?: string;
  demoUrl?: string;
};

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^finisher:\s*/i, '')
    .replace(/[+]/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeExerciseName(name: string): Set<string> {
  const weakTokens = new Set(['the', 'and', 'or', 'with', 'machine', 'barbell', 'dumbbell', 'cable']);
  return new Set(
    normalizeExerciseName(name)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !weakTokens.has(token))
  );
}

function findBestExerciseMediaMatch<T extends ExerciseMediaTarget>(
  exercise: T,
  rows: Array<{ normalizedName: string }>
): string | null {
  const normalized = normalizeExerciseName(exercise.name);
  const exact = rows.find((row) => row.normalizedName === normalized);
  if (exact) {
    return exact.normalizedName;
  }

  const tokens = tokenizeExerciseName(exercise.name);
  if (tokens.size === 0) {
    return null;
  }

  let bestMatch: { name: string; score: number } | null = null;

  for (const row of rows) {
    const rowTokens = tokenizeExerciseName(row.normalizedName);
    const overlap = Array.from(tokens).filter((token) => rowTokens.has(token)).length;
    const score = overlap / Math.max(tokens.size, rowTokens.size, 1);

    if (overlap >= 2 && score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: row.normalizedName, score };
    }
  }

  return bestMatch?.name ?? null;
}

interface CatalogEntry {
  displayName: string;
  normalizedName: string;
  thumbnailLabel?: string;
  videoId: string;
  embedUrl: string;
  mediaUrl: string;
  mediaType: 'GIF' | 'MP4' | 'IMAGE' | 'YOUTUBE';
  videoUrl: string;
  demoUrl: string;
}

function makeYoutubeEntry(displayName: string, normalizedName: string, videoId: string, thumbnailLabel?: string): CatalogEntry {
  return {
    displayName,
    normalizedName,
    thumbnailLabel: thumbnailLabel || displayName,
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    mediaUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    mediaType: 'YOUTUBE',
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    demoUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}

const STATIC_CATALOG: CatalogEntry[] = [
  makeYoutubeEntry('Jumping Jacks', 'jumping jacks', 'iSSAk4XCsRA'),
  makeYoutubeEntry('Push-Up', 'push-up', 'IODxDxX7oi4'),
  makeYoutubeEntry('Push-Up + Shoulder Tap', 'push-up shoulder tap', '1kE1Kx5zJ6o'),
  makeYoutubeEntry('Bodyweight Squat', 'bodyweight squat', 'aclHkVaku9U'),
  makeYoutubeEntry('Bodyweight Box Squat', 'bodyweight box squat', 'u5n_aE2GgX4', 'Box Squat'),
  makeYoutubeEntry('March in Place', 'march in place', '4m24k8o2d4k'),
  makeYoutubeEntry('Glute Bridge', 'glute bridge', '8BBbpHrPqQA'),
  makeYoutubeEntry('Reverse Lunge', 'reverse lunge', 'QOVaHwm-Q6U'),
  makeYoutubeEntry('Forearm Plank', 'forearm plank', 'pSHjTRCQxIw'),
  makeYoutubeEntry('Mountain Climbers', 'mountain climbers', 'nmwgirgXLYM'),
  makeYoutubeEntry('Bench Press', 'bench press', 'rT7DgCr-3pg'),
  makeYoutubeEntry('Dumbbell Row', 'dumbbell row', 'roCP6wCXPqo'),
  makeYoutubeEntry('Bicep Curl', 'bicep curl', 'ykJmrZ5v0Oo'),
  makeYoutubeEntry('Overhead Press', 'overhead press', 'qEwKCR5JCog'),
  makeYoutubeEntry('Romanian Deadlift', 'romanian deadlift', 'JCXUYuzwNrM'),
  makeYoutubeEntry('Standing Calf Raise', 'standing calf raise', 'gwLzBJYoWlI', 'Calf Raise'),
  makeYoutubeEntry('Burpees', 'burpees', 'auBLPXO8Fww'),
  makeYoutubeEntry('Squat Jumps', 'squat jumps', '72BSZupb-1I'),
  makeYoutubeEntry('High Knees', 'high knees', '8opcQdC-V-U'),
  makeYoutubeEntry('Cat-Cow Stretch', 'cat-cow stretch', 'w_UK8OV2L8A'),
  makeYoutubeEntry('Downward Dog', 'downward dog', 'YQOpeWn_uHQ'),
  makeYoutubeEntry('Dead Bug', 'dead bug', 'g_BYB0R-4Ws'),
  makeYoutubeEntry('Bicycle Crunch', 'bicycle crunch', '9FGilxCbdz8')
];

export async function attachExerciseMedia<T extends ExerciseMediaTarget>(exercises: T[]): Promise<T[]> {
  const normalizedNames = Array.from(
    new Set(
      exercises
        .map((exercise) => normalizeExerciseName(exercise.name))
        .filter((value) => value.length > 0)
    )
  );

  if (normalizedNames.length === 0) {
    return exercises;
  }

  let dbRows: Array<any> = [];
  try {
    const prisma = getPrismaClient();
    dbRows = await prisma.exerciseMedia.findMany();
  } catch {
    // If offline or DB unavailable, fallback gracefully to static catalog
    dbRows = [];
  }

  // Combine DB rows and static catalog
  const rows = [...dbRows, ...STATIC_CATALOG];
  const byName = new Map(rows.map((row) => [row.normalizedName, row]));

  return exercises.map((exercise) => {
    const matchKey = findBestExerciseMediaMatch(exercise, rows);
    const match = matchKey ? byName.get(matchKey) : null;
    const defaultYoutubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise proper form video tutorial')}`;

    if (!match) {
      return {
        ...exercise,
        thumbnailLabel: exercise.thumbnailLabel ?? exercise.name,
        demoUrl: exercise.demoUrl ?? defaultYoutubeUrl,
        videoUrl: exercise.videoUrl ?? defaultYoutubeUrl,
        mediaType: exercise.mediaType ?? 'MP4'
      };
    }

    const mediaUrl = match.mediaUrl ?? match.videoUrl ?? match.gifUrl ?? exercise.mediaUrl;
    const mediaType =
      match.mediaType && match.mediaType !== 'NONE'
        ? match.mediaType
        : match.videoUrl
          ? 'MP4'
          : match.gifUrl
            ? 'GIF'
            : (exercise.mediaType ?? 'MP4');

    return {
      ...exercise,
      thumbnailLabel: match.thumbnailLabel ?? match.displayName ?? exercise.thumbnailLabel ?? exercise.name,
      mediaUrl: mediaUrl,
      mediaType: match.mediaType || 'YOUTUBE',
      gifUrl: match.gifUrl ?? exercise.gifUrl,
      videoUrl: match.videoUrl ?? exercise.videoUrl ?? match.demoUrl ?? defaultYoutubeUrl,
      demoUrl: match.demoUrl ?? exercise.demoUrl ?? defaultYoutubeUrl,
      embedUrl: match.embedUrl || (match.videoId ? `https://www.youtube-nocookie.com/embed/${match.videoId}?rel=0` : undefined),
      videoId: match.videoId
    };
  });
}
