"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isOrganizer = exports.isFan = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                userType: decoded.userType
            };
            next();
        });
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticateToken = authenticateToken;
// Middleware to check if user is a fan
const isFan = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) !== 'fan') {
        return res.status(403).json({ error: 'Access denied. Fans only.' });
    }
    next();
};
exports.isFan = isFan;
// Middleware to check if user is an organizer
const isOrganizer = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) !== 'organizer') {
        return res.status(403).json({ error: 'Access denied. Organizers only.' });
    }
    next();
};
exports.isOrganizer = isOrganizer;
// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};
exports.isAdmin = isAdmin;
