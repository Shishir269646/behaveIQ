"use strict";
/**
 * @fileoverview Main application entry point.
 * This file sets up the Express application, configures middleware,
 * connects to the database, and defines the main routes.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Load and validate env vars early
require("./config/env");
const database_1 = require("./config/database"); // Import prisma and connectDB
const AppError_1 = __importDefault(require("./utils/AppError"));
const responseHandler_1 = require("./utils/responseHandler");
// Import routes
const identity_routes_1 = __importDefault(require("./routes/identity.routes"));
const behavior_routes_1 = __importDefault(require("./routes/behavior.routes"));
const emotion_routes_1 = __importDefault(require("./routes/emotion.routes"));
const abandonment_routes_1 = __importDefault(require("./routes/abandonment.routes"));
const device_routes_1 = __importDefault(require("./routes/device.routes"));
const discount_routes_1 = __importDefault(require("./routes/discount.routes"));
const fraud_routes_1 = __importDefault(require("./routes/fraud.routes"));
const voice_routes_1 = __importDefault(require("./routes/voice.routes"));
const content_routes_1 = __importDefault(require("./routes/content.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const heatmap_routes_1 = __importDefault(require("./routes/heatmap.routes"));
const websites_routes_1 = __importDefault(require("./routes/websites.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const events_routes_1 = __importDefault(require("./routes/events.routes"));
const experiments_routes_1 = __importDefault(require("./routes/experiments.routes"));
const personas_routes_1 = __importDefault(require("./routes/personas.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const sdk_routes_1 = __importDefault(require("./routes/sdk.routes"));
// Import middleware
const auth_1 = require("./middleware/auth");
const rateLimiter_1 = __importDefault(require("./middleware/rateLimiter"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
// Connect to databases
(0, database_1.connectDB)();
// Middleware
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.use(rateLimiter_1.default);
// Health check
app.get('/health', (req, res) => {
    (0, responseHandler_1.sendResponse)(res, 200, {
        status: 'up',
        timestamp: new Date()
    }, 'BEHAVEIQ API is running');
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/identity', auth_1.protect, identity_routes_1.default);
app.use('/api/behavior', auth_1.protect, behavior_routes_1.default);
app.use('/api/emotion', auth_1.protect, emotion_routes_1.default);
app.use('/api/abandonment', auth_1.protect, abandonment_routes_1.default);
app.use('/api/device', auth_1.protect, device_routes_1.default);
app.use('/api/discount', auth_1.protect, discount_routes_1.default);
app.use('/api/fraud', auth_1.protect, fraud_routes_1.default);
app.use('/api/voice', auth_1.protect, voice_routes_1.default);
app.use('/api/content', auth_1.protect, content_routes_1.default);
app.use('/api/heatmaps', auth_1.protect, heatmap_routes_1.default);
app.use('/api/websites', auth_1.protect, websites_routes_1.default);
app.use('/api/dashboard', auth_1.protect, dashboard_routes_1.default);
app.use('/api/events', auth_1.protect, events_routes_1.default);
app.use('/api/experiments', auth_1.protect, experiments_routes_1.default);
app.use('/api/personas', auth_1.protect, personas_routes_1.default);
app.use('/api/users', auth_1.protect, users_routes_1.default);
app.use('/api/sdk', sdk_routes_1.default);
app.get('/api', (req, res) => {
    (0, responseHandler_1.sendResponse)(res, 200, null, 'Welcome to the BEHAVEIQ API');
});
// 404 handler
app.all('*', (req, res, next) => {
    next(new AppError_1.default(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Error handler (must be last)
app.use(errorHandler_1.default);
exports.default = app;
