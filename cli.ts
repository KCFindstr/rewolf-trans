#!/usr/bin/env node
import { RewtCommandLine } from './src/cli/rewt-command-line';

async function main() {
  const rewt: RewtCommandLine = new RewtCommandLine();
  await rewt.execute();
}

if (require.main === module) {
  void main();
}
