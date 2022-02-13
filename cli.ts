#!/usr/bin/env node
import { logger } from './src/logger';
import { RewtCommandLine } from './src/cli/rewt-command-line';

async function main() {
  try {
    const rewt = new RewtCommandLine();
    await rewt.execute();
  } catch (e) {
    logger.error(e.stack || e);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
