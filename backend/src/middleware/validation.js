const { body, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(errors); // Pass errors to the error handling middleware
    }
    next();
};

exports.registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').notEmpty().trim().withMessage('Full name is required'),
];

exports.loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

exports.websiteValidation = [
    body('name').notEmpty().trim().withMessage('Website name is required'),
    body('domain').isURL().withMessage('Valid domain URL is required'),
];

exports.updateWebsiteValidation = [
    body('name').optional().notEmpty().trim().withMessage('Website name is required'),
    body('domain').optional().custom((value, { req }) => {
        if (!value) {
            return true; // Optional, so empty string/null/undefined is allowed
        }
        try {
            const url = new URL(value);
            // Allow localhost URLs or ensure it has a valid hostname
            if (url.hostname === 'localhost' || (url.hostname.includes('.') && !url.hostname.startsWith('.'))) {
                return true;
            }
            throw new Error('Valid domain URL is required (e.g., https://example.com or http://localhost:3000)');
        } catch (e) {
            throw new Error('Valid domain URL is required (e.g., https://example.com or http://localhost:3000)');
        }
    }).withMessage('Valid domain URL is required'),
    body('settings.emotionInterventions').optional().isArray().withMessage('Emotion interventions must be an array'),
    body('settings.emotionInterventions.*.emotion').optional().isIn(['frustrated', 'confused', 'excited', 'neutral', 'considering']).withMessage('Invalid emotion type'),
    body('settings.emotionInterventions.*.action').optional().isIn(['show_help_chat', 'show_guide', 'show_social_proof', 'show_comparison', 'none']).withMessage('Invalid intervention action'),
    body('settings.emotionInterventions.*.message').optional().isString().withMessage('Intervention message must be a string'),
    body('settings.emotionInterventions.*.data').optional().isObject().withMessage('Intervention data must be an object'),
    body('settings.fraudDetectionSettings').optional().isObject().withMessage('Fraud detection settings must be an object'),
    body('settings.fraudDetectionSettings.sensitivity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid fraud sensitivity level'),
    body('settings.fraudDetectionSettings.riskBasedActions').optional().isObject().withMessage('Risk-based actions must be an object'),
    body('settings.fraudDetectionSettings.riskBasedActions.requirePhoneVerification').optional().isBoolean().withMessage('requirePhoneVerification must be a boolean'),
    body('settings.fraudDetectionSettings.riskBasedActions.requireEmailVerification').optional().isBoolean().withMessage('requireEmailVerification must be a boolean'),
    body('settings.fraudDetectionSettings.riskBasedActions.disableCOD').optional().isBoolean().withMessage('disableCOD must be a boolean'),
    body('settings.fraudDetectionSettings.riskBasedActions.showCaptcha').optional().isBoolean().withMessage('showCaptcha must be a boolean'),
    body('settings.fraudDetectionSettings.riskBasedActions.manualReview').optional().isBoolean().withMessage('manualReview must be a boolean'),
    body('settings.fraudDetectionSettings.riskBasedActions.limitOrderValue')
        .optional()
        .custom((value, { req }) => {
            if (value === null || value === undefined || value === '') {
                return true; // Allow null, undefined, or empty string for optional field
            }
            if (typeof value === 'number' && value >= 0) {
                return true;
            }
            throw new Error('limitOrderValue must be a non-negative number if provided');
        }),
];

exports.updateUserValidation = [
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('fullName').optional().notEmpty().trim().withMessage('Full name is required'),
    body('companyName').optional().trim(),
    body('plan').optional().isIn(['free', 'pro', 'premium', 'enterprise']).withMessage('Invalid plan type'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role type'),
];