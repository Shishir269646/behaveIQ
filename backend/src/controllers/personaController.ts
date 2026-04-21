import { Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import * as personaService from '../services/personaService';
import { AuthenticatedRequest } from '../types';
import AppError from '../utils/AppError';

/**
 * Get all personas for a specific website
 */
export const getPersonas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const personas = await personaService.getWebsitePersonas(req.params.websiteId);
  res.json({ success: true, count: personas.length, data: { personas } });
});

/**
 * Discover new personas using ML
 */
export const discoverPersonas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.website?.id) throw new AppError('No website context found', 400);
  const { minSessions } = req.body;
  
  const personas = await personaService.discoverPersonas(req.website.id, minSessions);
  res.json({ success: true, message: `Discovered ${personas.length} personas`, data: { personas } });
});

/**
 * Create a new persona manually
 */
export const createPersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const persona = await personaService.createPersona(req.params.websiteId, req.body);
  res.status(201).json({ success: true, data: { persona } });
});

/**
 * Get single persona
 */
export const getPersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.website?.id) throw new AppError('No website context found', 400);
  const persona = await personaService.getPersonaById(req.params.id, req.website.id);
  res.json({ success: true, data: { persona } });
});

/**
 * Update persona
 */
export const updatePersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.website?.id) throw new AppError('No website context found', 400);
  const persona = await personaService.updatePersona(req.params.id, req.website.id, req.body);
  res.json({ success: true, data: { persona } });
});

/**
 * Delete a persona
 */
export const deletePersona = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.website?.id) throw new AppError('No website context found', 400);
  await personaService.deletePersona(req.params.id, req.website.id);
  res.json({ success: true, message: 'Persona deleted successfully' });
});

/**
 * Create personalization rule
 */
export const createPersonalizationRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.website?.id) throw new AppError('No website context found', 400);
  const rule = await personaService.createRule(req.params.id, req.website.id, req.body);
  res.status(201).json({ success: true, data: { rule } });
});
