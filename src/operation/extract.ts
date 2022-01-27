import * as fs from 'fs';
import * as path from 'path';
import { loadArchive } from '../archive/auto-load';
import { WolfArchive } from '../archive/wolf-archive';
import { WolfContext } from '../archive/wolf-context';
import { PATCH_DIR_NAME } from '../constants';
import { ensureDir, getFiles } from '../util';

export async function extract(dir: string, encoding: string) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory ${dir} does not exist.`);
  }
  WolfContext.readEncoding = encoding;
  const patchDir = path.join(dir, PATCH_DIR_NAME);
  const dataDir = path.join(dir, 'Data');
  ensureDir(patchDir);
  const files = getFiles(dataDir, true);
  const archives: WolfArchive[] = [];
  for (const file of files) {
    const archive = loadArchive(file);
    if (archive?.isValid) {
      console.log(archive.filename);
      archives.push(archive);
    }
  }
  for (const archive of archives) {
    archive.parse();
  }
}
