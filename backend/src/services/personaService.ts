import { prisma } from '../config/database';
import { callMLService } from './mlServiceClient';
import AppError from '../utils/AppError';

/**
 * Persona Transformation Logic
 */
const personaInclude = {
  stats: true,
  clusterData: {
    include: { behaviorPattern: true },
  },
};

/**
 * Get all personas for a specific website
 */
export const getWebsitePersonas = async (websiteId: string) => {
  return prisma.persona.findMany({
    where: { websiteId, isActive: true },
    orderBy: { stats: { sessionCount: 'desc' } },
    include: personaInclude,
  });
};

/**
 * Discover new personas using ML service
 */
export const discoverPersonas = async (websiteId: string, minSessions: number = 10) => {
  const sessionCount = await prisma.session.count({ where: { websiteId } });
  if (sessionCount < minSessions) {
    throw new AppError(`Need at least ${minSessions} sessions. Current: ${sessionCount}`, 400);
  }

  // Fetch session data (keeping logic compact)
  const sessions = await prisma.session.findMany({
    where: { websiteId },
    include: { intentScore: true, behavior: { include: { pageViews: true, clicks: true } }, deviceInfo: true },
    take: 1000,
  });

  const meaningfulSessions = formatAndFilterSessions(sessions);
  if (meaningfulSessions.length < 3) throw new AppError('Not enough meaningful session data for persona discovery', 400);

  const mlPayload = { websiteId, sessionData: meaningfulSessions, minClusters: 3, maxClusters: 6 };
  const mlResult = await callMLService('/clustering/discover-personas', mlPayload);

  return saveDiscoveredPersonas(websiteId, mlResult.personas);
};

/**
 * Helper to format sessions for ML
 */
function formatAndFilterSessions(sessions: any[]) {
  return sessions.map(s => {
    const pageViews = s.behavior?.pageViews || [];
    const totalTime = pageViews.reduce((sum: number, pv: any) => sum + (pv.timeSpent || 0), 0);
    const avgScroll = pageViews.length ? pageViews.reduce((sum: number, pv: any) => sum + (pv.scrollDepth || 0), 0) / pageViews.length : 0;
    const intent = s.intentScore?.final ?? s.intentScore?.initial ?? (s.behavior?.clicks?.length > 5 ? 60 : 30);

    return {
      _id: s.id,
      device: { type: s.deviceInfo?.type || 'unknown' },
      intentScore: Number(intent),
      avgScrollDepth: Number(avgScroll),
      totalClicks: Number(s.behavior?.clicks?.length || 0),
      pageViews: Number(pageViews.length),
      totalTimeSpent: Number(totalTime),
      pagesVisited: pageViews.map((pv: any) => pv.url).filter(Boolean).slice(0, 10),
    };
  }).filter(s => s.totalClicks > 0 || s.pageViews > 0 || s.totalTimeSpent > 0 || s.avgScrollDepth > 0);
}

/**
 * Persist discovered personas
 */
async function saveDiscoveredPersonas(websiteId: string, personas: any[]) {
  const createdPersonas = [];
  for (const p of personas) {
    const persona = await prisma.persona.create({
      data: {
        websiteId,
        name: p.name,
        description: p.description,
        isAutoDiscovered: true,
        clusterData: {
          create: {
            ...p.clusterData,
            behaviorPattern: { create: p.clusterData.behaviorPattern },
          },
        },
      },
      include: personaInclude,
    });

    if (p.sessionIds?.length) {
      await prisma.session.updateMany({ where: { id: { in: p.sessionIds }, websiteId }, data: { personaId: persona.id } });
    }

    const count = await prisma.session.count({ where: { personaId: persona.id } });
    await prisma.personaStats.upsert({
      where: { personaId: persona.id },
      update: { sessionCount: count, lastUpdated: new Date() },
      create: { personaId: persona.id, sessionCount: count },
    });
    createdPersonas.push(persona);
  }

  await prisma.websiteStats.upsert({
    where: { websiteId },
    update: { totalPersonas: { increment: createdPersonas.length } },
    create: { websiteId, totalPersonas: createdPersonas.length },
  });

  return createdPersonas;
}

export const createPersona = async (websiteId: string, data: any) => {
  return prisma.persona.create({
    data: { websiteId, ...data, isAutoDiscovered: false },
    include: personaInclude,
  });
};

export const getPersonaById = async (id: string, websiteId: string) => {
  const persona = await prisma.persona.findUnique({
    where: { id },
    include: { ...personaInclude, website: { select: { name: true, domain: true } } },
  });

  if (!persona || persona.websiteId !== websiteId) throw new AppError('Persona not found', 404);
  return persona;
};

export const updatePersona = async (id: string, websiteId: string, data: any) => {
  await getPersonaById(id, websiteId); // Ensure access
  return prisma.persona.update({
    where: { id },
    data,
    include: personaInclude,
  });
};

export const deletePersona = async (id: string, websiteId: string) => {
  await getPersonaById(id, websiteId); // Ensure access
  return prisma.persona.delete({ where: { id } });
};

export const createRule = async (personaId: string, websiteId: string, data: any) => {
  await getPersonaById(personaId, websiteId); // Ensure access
  return prisma.personalizationRule.create({
    data: { ...data, personaId },
  });
};
