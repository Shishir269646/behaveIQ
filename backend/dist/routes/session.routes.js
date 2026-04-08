"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Based on previous file, it should be:
const sessionController_1 = require("../controllers/sessionController");
const router = express_1.default.Router({ mergeParams: true });
router.get('/', sessionController_1.getSessions);
exports.default = router;
