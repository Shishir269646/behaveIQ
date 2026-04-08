"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All routes here are protected and only accessible by admins
router.use(auth_1.protect);
router.use((0, auth_1.authorize)('admin'));
router.route('/')
    .get(userController_1.getUsers);
router.route('/:id')
    .get(userController_1.getUser)
    .put(validation_1.updateUserValidation, validation_1.validate, userController_1.updateUser)
    .delete(userController_1.deleteUser);
exports.default = router;
