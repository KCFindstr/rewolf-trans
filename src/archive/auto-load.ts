import * as path from 'path';
import * as fs from 'fs';
import { equalsIgnoreCase } from '../util';
import { WolfArchive } from './wolf-archive';
import { WolfMap } from './wolf-map';

export function loadArchive(filename: string): WolfArchive {
  const parentDir = path.basename(path.dirname(filename));
  if (equalsIgnoreCase(parentDir, 'MapData')) {
    return new WolfMap(filename);
  } else if (equalsIgnoreCase(parentDir, 'BasicData')) {
    if (filename.endsWith('.project')) {
      const mapFilename = filename.substring(0, filename.length - 8) + '.dat';
      if (fs.existsSync(mapFilename)) {
        // return new WolfMap(mapFilename);
      }
    }
  } else {
    return null;
  }
}
