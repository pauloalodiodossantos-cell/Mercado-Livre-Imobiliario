import type { Express } from "express";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/create-app";
import { applyMigrationsToPglite } from "../src/lib/apply-migrations-pglite";
import { resetDatabase } from "./reset-database";

export type TestContext = {
  app: Express;
  prisma: PrismaClient;
  pglite: PGlite;
};

let context: TestContext | null = null;

export const getTestContext = async (): Promise<TestContext> => {
  if (context) {
    return context;
  }

  const pglite = await PGlite.create({ dataDir: "memory://" });
  await applyMigrationsToPglite(pglite);

  const prisma = new PrismaClient({
    adapter: new PrismaPGlite(pglite),
  });

  const app = createApp(prisma);
  context = { app, prisma, pglite };
  return context;
};

export const resetTestDatabase = async (): Promise<void> => {
  const { prisma } = await getTestContext();
  await resetDatabase(prisma);
};

export const teardownTestContext = async (): Promise<void> => {
  if (!context) {
    return;
  }

  await context.prisma.$disconnect();
  await context.pglite.close();
  context = null;
};
