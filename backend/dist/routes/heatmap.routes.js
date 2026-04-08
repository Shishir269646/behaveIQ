"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const heatmapController_1 = require("../controllers/heatmapController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// @route   GET /api/v1/heatmap
router.route('/').get(auth_1.protect, heatmapController_1.getHeatmapData);
exports.default = router;
