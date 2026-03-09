#!/usr/bin/env node

import { MemecoinBot } from './index';
import logger from './utils/logger';

async function main() {
  try {
    const bot = new MemecoinBot();
    await bot.initialize();
    await bot.start();
  } catch (error: any) {
    logger.error('Fatal error', { error: error.message });
    process.exit(1);
  }
}

main();
