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
const websiteController_1 = require("../controllers/websiteController");
const experimentController = __importStar(require("../controllers/experimentController"));
const personas_routes_1 = __importDefault(require("./personas.routes"));
const session_routes_1 = __importDefault(require("./session.routes"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Re-route to other resource routers
router.use('/:websiteId/personas', personas_routes_1.default);
router.use('/:websiteId/sessions', session_routes_1.default);
router.route('/')
    .get(websiteController_1.getWebsites)
    .post(validation_1.websiteValidation, validation_1.validate, websiteController_1.createWebsite);
router.route('/:id')
    .get(websiteController_1.getWebsite)
    .patch(validation_1.updateWebsiteValidation, validation_1.validate, websiteController_1.updateWebsite)
    .delete(websiteController_1.deleteWebsite);
router.get('/:id/sdk-script', websiteController_1.getSDKScript);
// New route to get all unique page URLs for a website
router.get('/:websiteId/pages', websiteController_1.getWebsitePages);
// New route for experiments specific to a website
router.get('/:id/experiments', experimentController.getExperiments);
exports.default = router;
