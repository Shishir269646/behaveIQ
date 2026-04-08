import express from 'express';
import * as personaController from '../controllers/personaController';

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(personaController.getPersonas)
    .post(personaController.createPersona);

router.route('/:id')
    .get(personaController.getPersona)
    .patch(personaController.updatePersona)
    .delete(personaController.deletePersona);

export default router;
