import express from 'express';
import * as personaController from '../controllers/personaController';
import { validate } from '../middleware/validate';
import { createPersonaSchema, updatePersonaSchema, discoverPersonasSchema, createPersonalizationRuleSchema } from '../validators/persona.validator';

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(personaController.getPersonas)
    .post(validate(createPersonaSchema), personaController.createPersona);

router.route('/discover')
    .post(validate(discoverPersonasSchema), personaController.discoverPersonas);

router.route('/:id')
    .get(personaController.getPersona)
    .patch(validate(updatePersonaSchema), personaController.updatePersona)
    .delete(personaController.deletePersona);

router.route('/:id/personalization-rules')
    .post(validate(createPersonalizationRuleSchema), personaController.createPersonalizationRule);

export default router;
