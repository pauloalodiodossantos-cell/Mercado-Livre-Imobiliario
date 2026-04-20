import { prisma } from "./prisma";
import { createApp } from "./create-app";

export const app = createApp(prisma);
export { createApp };
