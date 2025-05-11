"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Example authentication routes
router.post("/login", (req, res) => {
    res.send("Authentication API - Login");
});
router.post("/register", (req, res) => {
    res.send("Authentication API - Register");
});
exports.default = router;
