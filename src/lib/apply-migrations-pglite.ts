import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";

/**
 * Aplica todos os migration.sql em ordem (mesmo fluxo dos testes E2E).
 * Usa process.cwd() para funcionar com `tsx` e `node` a partir da raiz do projeto.
 */
export const applyMigrationsToPglite = async (pglite: PGlite): Promise<void> => {
  const migrationsRoot = path.resolve(process.cwd(), "prisma/migrations");

  const dirs = fs
    .readdirSync(migrationsRoot)
    .filter((name) => fs.statSync(path.join(migrationsRoot, name)).isDirectory())
    .sort();

  for (const dir of dirs) {
    const sqlPath = path.join(migrationsRoot, dir, "migration.sql");
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, "utf8");
      await pglite.exec(sql);
    }
  }
};
