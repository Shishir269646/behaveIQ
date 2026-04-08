"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserValidation = exports.updateWebsiteValidation = exports.websiteValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(errors); // Pass errors to the error handling middleware
    }
    next();
};
exports.validate = validate;
exports.registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('fullName').notEmpty().trim().withMessage('Full name is required'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.websiteValidation = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .trim()
        .withMessage('Website name is required'),
    (0, express_validator_1.body)('domain')
        .isURL({
        require_protocol: true,
        require_tld: false,
    })
        .withMessage('Valid domain URL is required'),
];
exports.updateWebsiteValidation = [
    (0, express_validator_1.body)('name').optional().notEmpty().trim().withMessage('Website name is required'),
    (0, express_validator_1.body)('domain').optional().custom((value) => {
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
        }
        catch (e) {
            throw new Error('Valid domain URL is required (e.g., https://example.com or http://localhost:3000)');
        }
    }).withMessage('Valid domain URL is required'),
    (0, express_validator_1.body)('settings.emotionInterventions').optional().isArray().withMessage('Emotion interventions must be an array'),
    (0, express_validator_1.body)('settings.emotionInterventions.*.emotion').optional().isIn(['frustrated', 'confused', 'excited', 'neutral', 'considering']).withMessage('Invalid emotion type'),
    (0, express_validator_1.body)('settings.emotionInterventions.*.action').optional().isIn(['show_help_chat', 'show_guide', 'show_social_proof', 'show_comparison', 'none']).withMessage('Invalid intervention action'),
    (0, express_validator_1.body)('settings.emotionInterventions.*.message').optional().isString().withMessage('Intervention message must be a string'),
    (0, express_validator_1.body)('settings.emotionInterventions.*.data').optional().isObject().withMessage('Intervention data must be an object'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings').optional().isObject().withMessage('Fraud detection settings must be an object'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.sensitivity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid fraud sensitivity level'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions').optional().isObject().withMessage('Risk-based actions must be an object'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions.requirePhoneVerification').optional().isBoolean().withMessage('requirePhoneVerification must be a boolean'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions.requireEmailVerification').optional().isBoolean().withMessage('requireEmailVerification must be a boolean'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions.disableCOD').optional().isBoolean().withMessage('disableCOD must be a boolean'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions.showCaptcha').optional().isBoolean().withMessage('showCaptcha must be a boolean'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions.manualReview').optional().isBoolean().withMessage('manualReview must be a boolean'),
    (0, express_validator_1.body)('settings.fraudDetectionSettings.riskBasedActions.limitOrderValue')
        .optional()
        .custom((value) => {
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
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('fullName').optional().notEmpty().trim().withMessage('Full name is required'),
    (0, express_validator_1.body)('companyName').optional().trim(),
    (0, express_validator_1.body)('plan').optional().isIn(['free', 'pro', 'premium', 'enterprise']).withMessage('Invalid plan type'),
    (0, express_validator_1.body)('role').optional().isIn(['user', 'admin']).withMessage('Invalid role type'),
];
