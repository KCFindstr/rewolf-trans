import { CTX } from '../constants';
import { safeJoin } from './escape-string';
import { TranslationContext } from './translation-context';

export class GameDatContext extends TranslationContext {
  constructor(public name: string) {
    super();
  }

  override get key(): string {
    return safeJoin([CTX.NUM.DAT, this.name]);
  }

  override toString(): string {
    return `${CTX.STR.DAT}:${safeJoin([this.name])}`;
  }

  static FromData(name: string) {
    return new GameDatContext(name);
  }

  static FromPath(path: string[]): GameDatContext {
    if (path.length !== 1) {
      throw new Error(`Invalid GameDat path: ${safeJoin(path)}`);
    }
    return new GameDatContext(path[0]);
  }
}
