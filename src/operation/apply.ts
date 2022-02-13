import * as path from 'path';
import * as fs from 'fs';
import { OUTPUT_DIR_NAME, PATCH_DIR_NAME } from '../constants';
import { RewtGame } from '../archive/rewt-game';
import { loadWolfArchive } from '../wolf/wolf-load';

export function apply(gameDir: string, patchDir: string, outDir: string) {
  patchDir = path.join(patchDir, PATCH_DIR_NAME);
  outDir = path.join(outDir, OUTPUT_DIR_NAME);
  const dataDir = path.join(gameDir, 'Data');
  const game = new RewtGame(dataDir, loadWolfArchive);
  game.parse();
  game.generatePatch();
  game.loadPatch(patchDir);
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  game.writeData(outDir);
}
