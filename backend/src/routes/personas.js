const express = require('express');
const router = express.Router();
const {
    getPersonas,
    discoverPersonas,
    getPersona,
    updatePersona,
    createPersonalizationRule
} = require('../controllers/personaController');
// const { protect } = require('../middleware/auth'); // Removed from here

// router.use(protect); // Moved to app.js mounting

router.get('/', getPersonas);
router.post('/discover', discoverPersonas);
router.get('/:id', getPersona);
router.patch('/:id', updatePersona);
router.post('/:id/personalization-rules', createPersonalizationRule);

module.exports = router;