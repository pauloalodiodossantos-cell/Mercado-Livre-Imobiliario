"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pglite_1 = require("@electric-sql/pglite");
const pglite_prisma_adapter_1 = require("pglite-prisma-adapter");
const client_1 = require("@prisma/client");
const create_app_1 = require("./create-app");
const apply_migrations_pglite_1 = require("./lib/apply-migrations-pglite");
const port = Number(process.env.PORT ?? 3000);
const main = async () => {
    const pglite = await pglite_1.PGlite.create({ dataDir: "memory://" });
    await (0, apply_migrations_pglite_1.applyMigrationsToPglite)(pglite);
    const prisma = new client_1.PrismaClient({
        adapter: new pglite_prisma_adapter_1.PrismaPGlite(pglite),
    });
    const app = (0, create_app_1.createApp)(prisma);
    const server = app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`[demo] API com PGlite em http://localhost:${port}`);
        // eslint-disable-next-line no-console
        console.log("[demo] Dados em memoria: ao parar o servidor tudo e apagado.");
        // eslint-disable-next-line no-console
        console.log("[demo] Veja fluxo no README.md (register -> listings -> offers -> pipeline).");
    });
    const shutdown = async () => {
        server.close();
        await prisma.$disconnect();
        await pglite.close();
    };
    process.on("SIGINT", () => {
        void shutdown().finally(() => process.exit(0));
    });
    process.on("SIGTERM", () => {
        void shutdown().finally(() => process.exit(0));
    });
};
void main().catch((err) => {
    console.error(err);
    process.exit(1);
});
