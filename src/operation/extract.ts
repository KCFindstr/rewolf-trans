import * as path from 'path';
import { RewtGame } from '../archive/rewt-game';
import { PATCH_DIR_NAME } from '../constants';
import { loadWolfArchive } from '../wolf/wolf-load';

export function extract(gameDir: string, patchDir: string, sourceDir?: string) {
  patchDir = path.join(patchDir, PATCH_DIR_NAME);
  const dataDir = path.join(gameDir, 'Data');
  const game = new RewtGame(dataDir, loadWolfArchive);
  game.parse();
  game.generatePatch();
  if (sourceDir) {
    game.loadPatch(sourceDir);
  }
  game.writePatch(patchDir);
}
