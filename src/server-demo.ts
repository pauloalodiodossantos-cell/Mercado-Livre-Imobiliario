import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./create-app";
import { applyMigrationsToPglite } from "./lib/apply-migrations-pglite";

const port = Number(process.env.PORT ?? 3000);

const main = async (): Promise<void> => {
  const pglite = await PGlite.create({ dataDir: "memory://" });
  await applyMigrationsToPglite(pglite);

  const prisma = new PrismaClient({
    adapter: new PrismaPGlite(pglite),
  });

  const app = createApp(prisma);

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[demo] API com PGlite em http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log("[demo] Dados em memoria: ao parar o servidor tudo e apagado.");
    // eslint-disable-next-line no-console
    console.log("[demo] Veja fluxo no README.md (register -> listings -> offers -> pipeline).");
  });

  const shutdown = async (): Promise<void> => {
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
