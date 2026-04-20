"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
const prisma_1 = require("../src/prisma");
async function globalTeardown() {
    await prisma_1.prisma.$disconnect();
}
