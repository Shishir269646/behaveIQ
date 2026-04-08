"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const experimentController_1 = require("../controllers/experimentController");
const router = express_1.default.Router();
router.route('/')
    .get(experimentController_1.getExperiments)
    .post(experimentController_1.createExperiment);
router.route('/:id')
    .get(experimentController_1.getExperiment)
    .put(experimentController_1.updateExperiment)
    .delete(experimentController_1.deleteExperiment);
router.patch('/:id/status', experimentController_1.updateExperimentStatus);
router.post('/:id/declare-winner', experimentController_1.declareWinner);
exports.default = router;
