import type { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../config/env';
import { verifyAppJwt } from '../routes/auth';

function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function applyDevHeaderAuth(request: FastifyRequest): boolean {
  if (env.NODE_ENV === 'production') {
    return false;
  }

  const testUserId = request.headers['x-test-user-id'];
  if (typeof testUserId === 'string' && testUserId.trim()) {
    request.userId = testUserId.trim();
    request.userEmail = request.headers['x-test-user-email'] as string | undefined;
    return true;
  }

  return false;
}

export async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (applyDevHeaderAuth(request)) {
    return;
  }

  const token = getBearerToken(request);

  if (!token) {
    await reply.status(401).send({ error: 'Missing Bearer token' });
    return;
  }

  try {
    const user = verifyAppJwt(token);
    request.userId = user.sub;
    request.userEmail = user.email;
  } catch (error) {
    request.log.warn({ err: error }, 'Auth failed');
    await reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function optionalAuthenticateRequest(request: FastifyRequest): Promise<void> {
  if (applyDevHeaderAuth(request)) {
    return;
  }

  const token = getBearerToken(request);

  if (!token) {
    // No token provided - allow unauthenticated access
    return;
  }

  try {
    const user = verifyAppJwt(token);
    request.userId = user.sub;
    request.userEmail = user.email;
  } catch (error) {
    request.log.warn({ err: error }, 'Optional auth failed, continuing as unauthenticated');
    // Don't fail on auth error for optional auth
  }
}
