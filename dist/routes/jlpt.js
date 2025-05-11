"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Example JLPT routes
router.get("/", (req, res) => {
    res.send("JLPT API - Get all JLPT levels");
});
router.get("/:level", (req, res) => {
    res.send(`JLPT API - Get details for level: ${req.params.level}`);
});
exports.default = router;
