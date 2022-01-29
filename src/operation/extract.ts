import * as path from 'path';
import { PATCH_DIR_NAME } from '../constants';
import { WolfGame } from './wolf-game';

export function extract(gameDir: string, patchDir: string, sourceDir?: string) {
  patchDir = path.join(patchDir, PATCH_DIR_NAME);
  const game = new WolfGame(gameDir);
  game.parse();
  game.generatePatch();
  if (sourceDir) {
    game.loadPatch(sourceDir);
  }
  game.writePatch(patchDir);
}
