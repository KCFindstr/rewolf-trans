import * as path from 'path';
import * as fs from 'fs';
import { OUTPUT_DIR_NAME, PATCH_DIR_NAME } from '../constants';
import { WolfGame } from './wolf-game';

export function apply(gameDir: string, patchDir: string, outDir: string) {
  patchDir = path.join(patchDir, PATCH_DIR_NAME);
  outDir = path.join(outDir, OUTPUT_DIR_NAME);
  const game = new WolfGame(gameDir);
  game.parse();
  game.generatePatch();
  game.loadPatch(patchDir);
  fs.rmSync(outDir, { recursive: true });
  game.writeData(outDir);
}
