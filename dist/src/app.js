"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = exports.app = void 0;
const prisma_1 = require("./prisma");
const create_app_1 = require("./create-app");
Object.defineProperty(exports, "createApp", { enumerable: true, get: function () { return create_app_1.createApp; } });
exports.app = (0, create_app_1.createApp)(prisma_1.prisma);
