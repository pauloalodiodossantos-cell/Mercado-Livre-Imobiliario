"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMigrationsToPglite = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
/**
 * Aplica todos os migration.sql em ordem (mesmo fluxo dos testes E2E).
 * Usa process.cwd() para funcionar com `tsx` e `node` a partir da raiz do projeto.
 */
const applyMigrationsToPglite = async (pglite) => {
    const migrationsRoot = node_path_1.default.resolve(process.cwd(), "prisma/migrations");
    const dirs = node_fs_1.default
        .readdirSync(migrationsRoot)
        .filter((name) => node_fs_1.default.statSync(node_path_1.default.join(migrationsRoot, name)).isDirectory())
        .sort();
    for (const dir of dirs) {
        const sqlPath = node_path_1.default.join(migrationsRoot, dir, "migration.sql");
        if (node_fs_1.default.existsSync(sqlPath)) {
            const sql = node_fs_1.default.readFileSync(sqlPath, "utf8");
            await pglite.exec(sql);
        }
    }
};
exports.applyMigrationsToPglite = applyMigrationsToPglite;
