const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, validate } = require('../middleware/validation');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;


// ═══════════════════════════════════════════════════════════════════════════
// 📁 backend/src/routes/websites.js
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
    getWebsites,
    createWebsite,
    getWebsite,
    updateWebsite,
    deleteWebsite,
    getSDKScript
} = require('../controllers/websiteController');
const { protect } = require('../middleware/auth');
const { websiteValidation, validate } = require('../middleware/validation');

router.use(protect); // All routes require authentication

router.route('/')
    .get(getWebsites)
    .post(websiteValidation, validate, createWebsite);

router.route('/:id')
    .get(getWebsite)
    .patch(updateWebsite)
    .delete(deleteWebsite);

router.get('/:id/sdk-script', getSDKScript);

module.exports = router;
