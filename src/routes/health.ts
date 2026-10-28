import type { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../db/prisma';
import { authenticateRequest } from '../middleware/auth';
import { createHealthMetricsIngestionService } from '../services/health-connect.service';

interface HealthConnectSummaryBody {
  userId: string;
  date: string;
  steps: number;
  activityMinutes: number;
  sourceApp?: string;
  deviceInstallId?: string;
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const ingestionService = createHealthMetricsIngestionService();

  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  fastify.post<{ Body: HealthConnectSummaryBody }>('/health/connect/summary', async (request, reply) => {
    const body = request.body;

    if (!body?.userId || typeof body.userId !== 'string') {
      return reply.status(400).send({ error: 'userId is required' });
    }

    if (!body?.date || typeof body.date !== 'string') {
      return reply.status(400).send({ error: 'date is required' });
    }

    if (typeof body.steps !== 'number' || typeof body.activityMinutes !== 'number') {
      return reply.status(400).send({ error: 'steps and activityMinutes must be numbers' });
    }

    try {
      const userExists = await prisma.user.findUnique({
        where: { id: body.userId },
        select: { id: true }
      });

      if (!userExists) {
        return reply.status(404).send({ error: 'User not found. Complete onboarding first.' });
      }

      const result = await ingestionService.ingestAggregatedMetrics({
        userId: body.userId,
        date: body.date,
        steps: body.steps,
        activityMinutes: body.activityMinutes,
        sourceApp: body.sourceApp,
        deviceInstallId: body.deviceInstallId
      });

      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Failed to ingest Health Connect summary'
      });
    }
  });

  /**
   * GET /health/vitals-summary
   * PHIA-inspired endpoint: Returns a 7-day vitals summary for the authenticated user.
   * Includes steps, active minutes, resting HR, HRV, active zone minutes, and VO2 max.
   */
  fastify.get('/health/vitals-summary', { preHandler: authenticateRequest }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const records = await prisma.healthRecord.findMany({
        where: {
          userId,
          startTime: { gte: sevenDaysAgo }
        },
        select: {
          type: true,
          value: true,
          unit: true,
          startTime: true,
          sourceApp: true
        },
        orderBy: { startTime: 'desc' }
      });

      // Aggregate by type for the summary
      const byType: Record<string, Array<{ value: number; unit: string | null; startTime: Date }>> = {};
      for (const r of records) {
        if (!byType[r.type]) byType[r.type] = [];
        byType[r.type].push({
          value: r.value !== null ? Number(r.value) : 0,
          unit: r.unit,
          startTime: r.startTime
        });
      }

      function avg(arr: Array<{ value: number }>): number | null {
        if (!arr?.length) return null;
        return Math.round(arr.reduce((s, x) => s + x.value, 0) / arr.length);
      }

      function total(arr: Array<{ value: number }>): number | null {
        if (!arr?.length) return null;
        return Math.round(arr.reduce((s, x) => s + x.value, 0));
      }

      const summary = {
        periodDays: 7,
        generatedAt: new Date().toISOString(),
        steps: {
          total: total(byType['STEPS'] ?? []),
          daily: byType['STEPS']?.map(r => ({ date: r.startTime, value: r.value })) ?? []
        },
        activityMinutes: {
          total: total(byType['WORKOUT'] ?? []),
          entries: (byType['WORKOUT'] ?? []).length
        },
        activeZoneMinutes: {
          total: total(byType['ACTIVE_ZONE_MINUTES'] ?? []),
          daily: byType['ACTIVE_ZONE_MINUTES']?.map(r => ({ date: r.startTime, value: r.value })) ?? []
        },
        heartRate: {
          restingAvg: avg(byType['RESTING_HEART_RATE'] ?? byType['HEART_RATE'] ?? []),
          unit: 'bpm',
          readings: (byType['RESTING_HEART_RATE'] ?? byType['HEART_RATE'] ?? []).length
        },
        hrv: {
          avg: avg(byType['HRV_RESTING'] ?? []),
          unit: 'ms',
          readings: (byType['HRV_RESTING'] ?? []).length
        },
        vo2Max: {
          latest: byType['VO2_MAX']?.[0]?.value ?? null,
          unit: 'mL/kg/min'
        },
        bloodPressure: {
          readings: (byType['BLOOD_PRESSURE'] ?? []).length
        },
        oxygenSaturation: {
          avg: avg(byType['OXYGEN_SATURATION'] ?? []),
          unit: '%'
        },
        weight: {
          latest: byType['WEIGHT']?.[0]?.value ?? null,
          unit: byType['WEIGHT']?.[0]?.unit ?? 'kg'
        },
        totalRecords: records.length
      };

      return reply.status(200).send(summary);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to retrieve vitals summary' });
    }
  });

  /**
   * GET /health/connect/record-types
   * Returns all supported HealthRecord types including PHIA-inspired vitals types.
   */
  fastify.get('/health/connect/record-types', async (_request, reply) => {
    return reply.status(200).send({
      recordTypes: [
        { type: 'STEPS', description: 'Daily step count', unit: 'steps' },
        { type: 'HEART_RATE', description: 'Heart rate readings', unit: 'bpm' },
        { type: 'RESTING_HEART_RATE', description: 'Resting heart rate (PHIA)', unit: 'bpm' },
        { type: 'HRV_RESTING', description: 'Heart rate variability at rest (PHIA)', unit: 'ms' },
        { type: 'ACTIVE_ZONE_MINUTES', description: 'Minutes in active heart rate zones (PHIA)', unit: 'minutes' },
        { type: 'VO2_MAX', description: 'Estimated VO2 max (PHIA)', unit: 'mL/kg/min' },
        { type: 'BLOOD_PRESSURE', description: 'Blood pressure readings (PHIA)', unit: 'mmHg' },
        { type: 'OXYGEN_SATURATION', description: 'Blood oxygen saturation (PHIA)', unit: '%' },
        { type: 'RESPIRATORY_RATE', description: 'Breaths per minute (PHIA)', unit: 'breaths/min' },
        { type: 'BODY_TEMPERATURE', description: 'Body temperature (PHIA)', unit: '°C' },
        { type: 'SLEEP_SESSION', description: 'Sleep tracking sessions', unit: 'minutes' },
        { type: 'WORKOUT', description: 'Workout sessions', unit: 'minutes' },
        { type: 'WEIGHT', description: 'Body weight', unit: 'kg' },
        { type: 'HEIGHT', description: 'Height', unit: 'cm' },
        { type: 'BLOOD_GLUCOSE', description: 'Blood glucose levels', unit: 'mg/dL' }
      ]
    });
  });
}

