"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const referral_controller_1 = require("../controllers/referral-controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication to all referral routes
router.use(auth_1.authenticateToken);
// Validate a referral code
router.post('/validate', referral_controller_1.validateReferralCode);
// Apply referral code during signup/purchase
router.post('/apply', referral_controller_1.applyReferralCode);
exports.default = router;
