"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownTestContext = exports.resetTestDatabase = exports.getTestContext = void 0;
const pglite_1 = require("@electric-sql/pglite");
const pglite_prisma_adapter_1 = require("pglite-prisma-adapter");
const client_1 = require("@prisma/client");
const create_app_1 = require("../src/create-app");
const apply_migrations_pglite_1 = require("../src/lib/apply-migrations-pglite");
const reset_database_1 = require("./reset-database");
let context = null;
const getTestContext = async () => {
    if (context) {
        return context;
    }
    const pglite = await pglite_1.PGlite.create({ dataDir: "memory://" });
    await (0, apply_migrations_pglite_1.applyMigrationsToPglite)(pglite);
    const prisma = new client_1.PrismaClient({
        adapter: new pglite_prisma_adapter_1.PrismaPGlite(pglite),
    });
    const app = (0, create_app_1.createApp)(prisma);
    context = { app, prisma, pglite };
    return context;
};
exports.getTestContext = getTestContext;
const resetTestDatabase = async () => {
    const { prisma } = await (0, exports.getTestContext)();
    await (0, reset_database_1.resetDatabase)(prisma);
};
exports.resetTestDatabase = resetTestDatabase;
const teardownTestContext = async () => {
    if (!context) {
        return;
    }
    await context.prisma.$disconnect();
    await context.pglite.close();
    context = null;
};
exports.teardownTestContext = teardownTestContext;
