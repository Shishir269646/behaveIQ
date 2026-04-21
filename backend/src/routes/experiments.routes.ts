import express from 'express';
import {
    getExperiments,
    createExperiment,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    updateExperimentStatus,
    declareWinner
} from '../controllers/experimentController';
import { validate } from '../middleware/validate';
import { 
    getExperimentsSchema, 
    createExperimentSchema, 
    getExperimentSchema as getExperimentParamSchema, // Alias to avoid conflict
    updateExperimentStatusSchema, 
    declareWinnerSchema, 
    updateExperimentSchema as updateExperimentBodySchema, // Alias
    deleteExperimentSchema 
} from '../validators/experiment.validator';

const router = express.Router();

router.route('/')
    .get(validate(getExperimentsSchema), getExperiments)
    .post(validate(createExperimentSchema), createExperiment);

router.route('/:id')
    .get(validate(getExperimentParamSchema), getExperiment)
    .put(validate(updateExperimentBodySchema), updateExperiment)
    .delete(validate(deleteExperimentSchema), deleteExperiment);

router.patch('/:id/status', validate(updateExperimentStatusSchema), updateExperimentStatus);
router.post('/:id/declare-winner', validate(declareWinnerSchema), declareWinner);

export default router;
