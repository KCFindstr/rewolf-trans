import * as path from 'path';
import * as fs from 'fs';
import { equalsIgnoreCase } from '../util';
import { RewtArchive } from '../archive/rewt-archive';
import { WolfMap } from './wolf-map';
import { WolfDatabase } from './wolf-database';
import { WolfCE } from './wolf-ce';

export function loadWolfArchive(filename: string): RewtArchive {
  const parentDir = path.basename(path.dirname(filename));
  const basename = path.basename(filename);
  if (equalsIgnoreCase(parentDir, 'MapData')) {
    return new WolfMap(filename);
  } else if (equalsIgnoreCase(parentDir, 'BasicData')) {
    if (basename.endsWith('.project')) {
      if (equalsIgnoreCase(basename, 'sysdatabasebasic.project')) {
        return null;
      }
      const mapFilename = filename.substring(0, filename.length - 8) + '.dat';
      if (fs.existsSync(mapFilename)) {
        return new WolfDatabase(filename, mapFilename);
      }
    } else if (equalsIgnoreCase(basename, 'commonevent.dat')) {
      return new WolfCE(filename);
    }
  } else {
    return null;
  }
}
