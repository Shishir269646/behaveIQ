const { body, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
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
    body('domain').optional().isURL().withMessage('Valid domain URL is required'),
];