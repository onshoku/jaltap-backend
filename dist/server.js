"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import route groups
const profile_1 = __importDefault(require("./routes/profile"));
const authentication_1 = __importDefault(require("./routes/authentication"));
const jlpt_1 = __importDefault(require("./routes/jlpt"));
const admin_1 = __importDefault(require("./routes/admin"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON
app.use(express_1.default.json());
// Serve Angular build only in non-local environments
if (process.env.STATUS !== "local") {
    app.use("/", express_1.default.static(path_1.default.join(__dirname, "/dist")));
}
// API groups
app.use("/api/profile", profile_1.default);
app.use("/api/auth", authentication_1.default);
app.use("/api/jlpt", jlpt_1.default);
app.use("/api/admin", admin_1.default);
// Angular routing (fallback to index.html)
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "/dist/index.html"));
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
