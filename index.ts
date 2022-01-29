import { extract } from './src/operation/extract';
import yargs from 'yargs';
import { WolfContext } from './src/archive/wolf-context';
import { apply } from './src/operation/apply';
import { logger, LogLevel } from './src/logger';

async function main() {
  const options = await yargs(process.argv.slice(2))
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
    WolfContext.readEncoding = options.renc;
    WolfContext.writeEncoding = options.wenc;
    if (options.verbose) {
      logger.logLevel = LogLevel.DEBUG;
    }
    if (options.extract) {
      extract(options.root, options.patch);
    } else if (options.generate) {
      extract(options.root, options.patch, options.source);
    } else if (options.apply) {
      apply(options.root, options.patch, options.output);
    } else {
      logger.error(
        'At least one of --extract, --patch, or --apply must be specified.',
      );
    }
  } catch (e) {
    logger.error(e.stack || e);
  }
}

if (require.main === module) {
  void main();
}

export { extract };
