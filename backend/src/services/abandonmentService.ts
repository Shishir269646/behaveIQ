import mlServiceClient from './mlServiceClient';
import { prisma } from '../config/database';
import AppError from '../utils/AppError';
import { SessionOutcome } from '@prisma/client';

interface PredictionResult {
  riskScore: number;
  prediction: string;
  recommendedIntervention: string;
}

/**
 * Predict abandonment risk
 */
export const predictAbandonmentRisk = async (
  sessionId: string,
  websiteId: string,
  userId?: string
): Promise<PredictionResult> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { 
      behavior: {
        include: {
          pageViews: true,
          cartActions: true
        }
      }, 
      intentScore: true 
    }
  });

  if (!session) {
    return { riskScore: 0, prediction: 'low_risk', recommendedIntervention: 'none' };
  }

  const features = {
    timeOnPage: session.duration || 0,
    pageViewCount: session.behavior?.pageViews?.length || 0,
    cartActionCount: session.behavior?.cartActions?.length || 0,
    intentScore: session.intentScore?.final || 0,
  };

  try {
    const mlResult = await mlServiceClient.callMLService('/predict/abandonment', {
      websiteId,
      sessionId,
      features
    });

    const riskScore = mlResult.riskScore || 0;
    const prediction = mlResult.prediction || 'low_risk';

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        abandonmentRiskScore: riskScore,
        abandonmentPrediction: prediction,
      }
    });

    return {
      riskScore,
      prediction,
      recommendedIntervention: mlResult.recommendedIntervention || 'none'
    };
  } catch (error: any) {
    console.error('[AbandonmentService] ML Error:', error.message);
    return { riskScore: 0.1, prediction: 'low_risk', recommendedIntervention: 'none' };
  }
};

/**
 * Track intervention response
 */
export const trackInterventionResponse = async (
  interventionId: string,
  responseStatus: string,
  sessionOutcome: string | null = null
) => {
  const intervention = await prisma.sessionIntervention.findUnique({
    where: { id: interventionId },
    include: { session: true }
  });

  if (!intervention) {
    throw new AppError('Intervention not found', 404);
  }

  const updateData: any = {
    response: responseStatus,
    timestamp: new Date(),
  };

  if (sessionOutcome === 'purchase') {
    updateData.effectiveness = 1;
  } else if (responseStatus === 'clicked') {
    updateData.effectiveness = updateData.effectiveness || 0.5;
  }

  const updatedIntervention = await prisma.sessionIntervention.update({
    where: { id: interventionId },
    data: updateData,
  });

  if (sessionOutcome && intervention.sessionId) {
    await prisma.session.update({
      where: { id: intervention.sessionId },
      data: { outcome: sessionOutcome as SessionOutcome }
    });
  }

  return updatedIntervention;
};

/**
 * Get statistics for abandonment
 */
export const getStats = async (websiteId: string, days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const nonConvertedSessions = await prisma.session.findMany({
    where: {
      websiteId,
      outcome: { not: 'purchase' },
      createdAt: { gte: startDate }
    },
    include: {
      intentScore: true
    },
  });

  const overallRisk = nonConvertedSessions.length > 0
    ? (nonConvertedSessions.reduce((sum, s) => sum + (s.intentScore?.final || 0), 0) / nonConvertedSessions.length)
    : 0;

  const interventions = await prisma.sessionIntervention.findMany({
    where: {
      session: {
        websiteId: websiteId
      },
      timestamp: { gte: startDate }
    },
    select: {
      type: true,
      response: true,
      effectiveness: true
    }
  });

  const triggered = interventions.length;
  const recovered = interventions.filter(i => i.effectiveness === 1).length;
  const recoveryRate = triggered > 0 ? (recovered / triggered) * 100 : 0;

  const performanceMap: Record<string, any> = {};
  interventions.forEach(i => {
    const type = i.type || 'unknown';
    if (!performanceMap[type]) {
      performanceMap[type] = { type, shown: 0, clicked: 0, converted: 0 };
    }
    performanceMap[type].shown++;
    if (i.response === 'clicked') performanceMap[type].clicked++;
    if (i.effectiveness === 1) performanceMap[type].converted++;
  });

  const performance = Object.values(performanceMap).map(stats => ({
    ...stats,
    effectiveness: stats.shown > 0 ? (stats.converted / stats.shown) * 100 : 0
  }));

  const sessionsForTrend = await prisma.session.findMany({
    where: {
      websiteId: websiteId,
      outcome: { not: 'purchase' },
      createdAt: { gte: startDate }
    },
    include: {
      intentScore: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const trendMap = new Map<string, { totalIntentScore: number; sessionsCount: number }>();
  sessionsForTrend.forEach(session => {
    const dateKey = session.createdAt.toISOString().split('T')[0]!;
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { totalIntentScore: 0, sessionsCount: 0 });
    }
    const data = trendMap.get(dateKey)!;
    data.totalIntentScore += (session.intentScore?.final || 0);
    data.sessionsCount++;
  });

  const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
    date: date,
    riskScore: data.sessionsCount > 0 ? parseFloat(((data.totalIntentScore / data.sessionsCount)).toFixed(2)) : 0,
    sessions: data.sessionsCount
  }));

  return {
    overallRisk: parseFloat(overallRisk.toFixed(2)),
    interventionsTriggered: triggered,
    recoveryRate: parseFloat(recoveryRate.toFixed(2)),
    interventionPerformance: performance,
    riskTrends: trends
  };
};
