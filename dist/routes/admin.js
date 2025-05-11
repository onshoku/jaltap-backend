"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Example admin routes
router.get("/dashboard", (req, res) => {
    res.send("Admin API - Dashboard");
});
router.post("/create", (req, res) => {
    res.send("Admin API - Create new resource");
});
exports.default = router;
