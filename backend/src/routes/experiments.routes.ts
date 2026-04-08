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

const router = express.Router();

router.route('/')
    .get(getExperiments)
    .post(createExperiment);

router.route('/:id')
    .get(getExperiment)
    .put(updateExperiment)
    .delete(deleteExperiment);

router.patch('/:id/status', updateExperimentStatus);
router.post('/:id/declare-winner', declareWinner);

export default router;
