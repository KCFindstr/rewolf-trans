import * as path from 'path';
import { PATCH_DIR_NAME } from '../constants';
import {
  DefaultGenerateOptions,
  GenerateOptions,
  SetGlobalOptions,
} from './options';
import { GlobalRegistry } from './registry';

export function generate(options: GenerateOptions) {
  SetGlobalOptions(options, DefaultGenerateOptions);
  const patchDir = path.join(options.patchDir, PATCH_DIR_NAME);
  const gameClass = GlobalRegistry.getGame(options.game);
  const game = new gameClass(options.gameDir);
  game.parse();
  game.generatePatch();
  if (options.sourceDirs) {
    for (const dir of options.sourceDirs) {
      game.loadPatch(dir);
    }
  }
  game.writePatch(patchDir);
}
