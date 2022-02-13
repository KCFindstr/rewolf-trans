import * as path from 'path';
import * as fs from 'fs';
import { OUTPUT_DIR_NAME, PATCH_DIR_NAME } from '../constants';
import { ApplyOptions, DefaultApplyOptions, SetGlobalOptions } from './options';
import { GlobalRegistry } from './registry';

export function apply(options: ApplyOptions) {
  SetGlobalOptions(options, DefaultApplyOptions);
  const patchDir = path.join(options.patchDir, PATCH_DIR_NAME);
  const outDir = path.join(options.outDir, OUTPUT_DIR_NAME);
  const gameClass = GlobalRegistry.getGame(options.game);
  const game = new gameClass(options.gameDir);
  game.parse();
  game.generatePatch();
  game.loadPatch(patchDir);
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  game.writeData(outDir);
}
