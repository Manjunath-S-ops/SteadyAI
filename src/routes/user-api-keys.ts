import type { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../db/prisma';
import { authenticateRequest } from '../middleware/auth';

interface ApiKeysBody {
  geminiApiKey?: string;
  groqApiKey?: string;
}

export async function userApiKeysRoutes(fastify: FastifyInstance): Promise<void> {
  // GET current API keys (masked)
  fastify.get(
    '/user/api-keys',
    { preHandler: [authenticateRequest] },
    async (request, reply) => {
      const prisma = getPrismaClient();
      const row = await prisma.userApiKeys.findUnique({
        where: { userId: request.userId! },
        select: { geminiApiKey: true, groqApiKey: true, updatedAt: true }
      });

      return reply.send({
        hasGeminiKey: Boolean(row?.geminiApiKey),
        hasGroqKey: Boolean(row?.groqApiKey),
        geminiApiKeyMasked: row?.geminiApiKey ? maskKey(row.geminiApiKey) : null,
        groqApiKeyMasked: row?.groqApiKey ? maskKey(row.groqApiKey) : null,
        updatedAt: row?.updatedAt ?? null
      });
    }
  );

  // POST save API keys
  fastify.post<{ Body: ApiKeysBody }>(
    '/user/api-keys',
    { preHandler: [authenticateRequest] },
    async (request, reply) => {
      const { geminiApiKey, groqApiKey } = request.body ?? {};
      const prisma = getPrismaClient();

      const data: { geminiApiKey?: string | null; groqApiKey?: string | null } = {};
      if (geminiApiKey !== undefined) {
        data.geminiApiKey = geminiApiKey.trim() || null;
      }
      if (groqApiKey !== undefined) {
        data.groqApiKey = groqApiKey.trim() || null;
      }

      await prisma.userApiKeys.upsert({
        where: { userId: request.userId! },
        create: { userId: request.userId!, ...data },
        update: data
      });

      return reply.send({ success: true });
    }
  );
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(12, key.length - 8))}${key.slice(-4)}`;
}
