"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDevices = exports.stitchDevices = void 0;
const deviceStitchingService_1 = __importDefault(require("../services/deviceStitchingService"));
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
/**
 * Stitch two devices together
 */
exports.stitchDevices = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { fingerprint1, fingerprint2 } = req.body;
    const result = await deviceStitchingService_1.default.stitchDevices(fingerprint1, fingerprint2);
    res.json({
        success: true,
        data: result
    });
});
/**
 * Get all devices for a user
 */
exports.getUserDevices = (0, helpers_1.asyncHandler)(async (req, res) => {
    const userId = req.params.userId;
    const devices = await database_1.prisma.userDevice.findMany({ where: { userId } });
    res.json({
        success: true,
        data: devices
    });
});
