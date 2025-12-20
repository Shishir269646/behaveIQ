const express = require('express');
const router = express.Router();
const {
    getExperiments,
    createExperiment,
    getExperiment,
    updateExperimentStatus,
    declareWinner
} = require('../controllers/experimentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getExperiments)
    .post(createExperiment);

router.get('/:id', getExperiment);
router.patch('/:id/status', updateExperimentStatus);
router.post('/:id/declare-winner', declareWinner);

module.exports = router;