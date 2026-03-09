#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const logger_1 = __importDefault(require("./utils/logger"));
async function main() {
    try {
        const bot = new index_1.MemecoinBot();
        await bot.initialize();
        await bot.start();
    }
    catch (error) {
        logger_1.default.error('Fatal error', { error: error.message });
        process.exit(1);
    }
}
main();
//# sourceMappingURL=main.js.map