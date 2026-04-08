"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController = __importStar(require("../controllers/dashboardController"));
const router = express_1.default.Router();
router.get('/overview', dashboardController.getOverview);
router.get('/realtime', dashboardController.getRealtimeVisitors);
router.get('/heatmap', dashboardController.getHeatmap);
router.get('/insights', dashboardController.getInsights);
router.get('/funnel', dashboardController.getConversionFunnel);
router.get('/top-pages', dashboardController.getTopPages);
router.get('/intent-distribution', dashboardController.getIntentDistribution);
router.get('/fraud-summary', dashboardController.getFraudSummary);
router.get('/persona-summary', dashboardController.getPersonaSummary);
router.get('/personalization-status', dashboardController.getPersonalizationStatus);
router.get('/heatmap-summary', dashboardController.getHeatmapSummary);
router.get('/experiment-summary', dashboardController.getExperimentSummary);
router.get('/content-summary', dashboardController.getContentSummary);
router.get('/abandonment-summary', dashboardController.getAbandonmentSummary);
router.get('/discount-summary', dashboardController.getDiscountSummary);
exports.default = router;
