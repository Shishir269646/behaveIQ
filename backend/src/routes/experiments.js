const express = require('express');
const router = express.Router();
const {
    getExperiments,
    createExperiment,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    updateExperimentStatus,
    declareWinner
} = require('../controllers/experimentController');
// const { protect } = require('../middleware/auth'); // Removed from here

// router.use(protect); // Moved to app.js mounting

router.route('/')
    .get(getExperiments)
    .post(createExperiment);

router.route('/:id')
    .get(getExperiment)
    .put(updateExperiment)
    .delete(deleteExperiment);

router.patch('/:id/status', updateExperimentStatus);
router.post('/:id/declare-winner', declareWinner);

module.exports = router;