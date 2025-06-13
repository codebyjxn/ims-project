"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin-controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const adminController = new admin_controller_1.AdminController();
// Apply authentication and admin check to all admin routes
router.use(auth_1.authenticateToken);
router.use(auth_1.isAdmin);
// Seed PostgreSQL database
router.post('/seed', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield adminController.seedData(req, res);
}));
// Migrate data from PostgreSQL to MongoDB
router.post('/migrate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield adminController.migrateData(req, res);
}));
// Health check for both databases
router.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield adminController.healthCheck(req, res);
}));
exports.default = router;
