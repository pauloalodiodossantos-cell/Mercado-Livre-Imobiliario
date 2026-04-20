"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
require("dotenv/config");
const node_child_process_1 = require("node:child_process");
const node_path_1 = __importDefault(require("node:path"));
async function globalSetup() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is required for integration tests (see .env)");
    }
    const projectRoot = node_path_1.default.resolve(__dirname, "..");
    (0, node_child_process_1.execSync)("npx prisma migrate deploy", {
        stdio: "inherit",
        env: process.env,
        cwd: projectRoot,
    });
}
