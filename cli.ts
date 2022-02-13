#!/usr/bin/env node

import { generate } from './src/operation/generate';
import yargs from 'yargs';
import { apply } from './src/operation/apply';
import { logger, LogLevel } from './src/logger';
import { RewtOptions } from './src/operation/options';

async function main() {
  const args = await yargs(process.argv.slice(2))
    .usage('Extract strings from WolfRPG games and patch data.')
    .options({
      extract: {
        type: 'boolean',
        description:
          'Extract translatable strings. Existing files will be overwritten, so make sure to backup your work and avoid using your working directory as --patch.',
        implies: ['root', 'patch'],
        conflicts: ['generate', 'output', 'apply'],
      },
      apply: {
        type: 'boolean',
        description:
          'Apply patch. Output directory will be cleared before generating data files from patch.',
        implies: ['root', 'patch', 'output'],
        conflicts: ['generate', 'extract'],
      },
      generate: {
        type: 'boolean',
        description:
          'Read patch files from --source directory and generate patch text files to --patch directory. This is useful for upgrading from wolf-trans, but some data might not be preserved.',
        implies: ['root', 'source', 'patch'],
        conflicts: ['extract', 'apply'],
      },
      source: {
        type: 'string',
        description: 'Source directory for reading patch files.',
        implies: ['generate'],
        conflicts: ['output'],
      },
      output: {
        type: 'string',
        description:
          'Output directory for patched game files (use a nonexistent directory if possible).',
      },
      patch: {
        type: 'string',
        description: 'Patch text file directory.',
      },
      root: {
        type: 'string',
        description: 'Game root directory (where Game.exe lives).',
        demandOption: true,
      },
      renc: {
        type: 'string',
        description: 'Encoding for reading game data files.',
        default: 'SHIFT_JIS',
      },
      wenc: {
        type: 'string',
        description: 'Encoding for writing game data files.',
        default: 'GBK',
      },
      verbose: {
        type: 'boolean',
        description: 'Output verbose log.',
      },
    })
    .parse();
  try {
    const options: RewtOptions = {
      game: 'wolf',
      gameDir: args.root,
      patchDir: args.patch,
      readEncoding: args.renc,
      writeEncoding: args.wenc,
      pathResolver: null,
    };
    if (args.verbose) {
      logger.logLevel = LogLevel.DEBUG;
    }
    if (args.extract) {
      generate(options);
    } else if (args.generate) {
      generate({
        ...options,
        sourceDirs: [args.source],
      });
    } else if (args.apply) {
      apply({
        ...options,
        outDir: args.output,
      });
    } else {
      logger.error(
        'At least one of --extract, --generate, or --apply must be specified.',
      );
    }
  } catch (e) {
    logger.error(e.stack || e);
  }
}

if (require.main === module) {
  void main();
}
