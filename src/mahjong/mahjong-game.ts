import * as path from 'path';
import { RewtArchive } from '../archive/rewt-archive';
import { RewtGame } from '../archive/rewt-game';
import { equalsIgnoreCase } from '../util';
import { MahjongArchive } from './mahjong-archive';

export class MahjongGame extends RewtGame {
  public loadArchive(filename: string): RewtArchive {
    const parsed = path.parse(filename);
    if (!equalsIgnoreCase(parsed.ext, '.dat')) {
      return null;
    }
    // TODO: Remove
    if (!filename.includes('TADD')) {
      return null;
    }
    const archive = new MahjongArchive(filename);
    if (!archive.isValid) {
      return null;
    }
    return archive;
  }
}
