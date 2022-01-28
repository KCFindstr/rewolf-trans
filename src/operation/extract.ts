import * as path from 'path';
import { WolfContext } from '../archive/wolf-context';
import { PATCH_DIR_NAME } from '../constants';
import { WolfGame } from './wolf-game';

export function extract(dir: string, encoding: string) {
  WolfContext.readEncoding = encoding;
  const patchDir = path.join(dir, PATCH_DIR_NAME);
  const game = new WolfGame(dir);
  game.parse();
  game.generatePatch();
  game.writePatch(patchDir);
}
