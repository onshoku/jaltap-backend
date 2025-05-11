"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Example profile routes
router.get("/", (req, res) => {
    res.send("Profile API - Get all profiles");
});
router.get("/:id", (req, res) => {
    res.send(`Profile API - Get profile with ID: ${req.params.id}`);
});
exports.default = router;
