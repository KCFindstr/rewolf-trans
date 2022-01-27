import { CTX } from '../constants';
import { ICustomKey, IString } from '../interfaces';
import { CommonEventContext } from './common-event-context';
import { DatabaseContext } from './database-context';
import { safeSplit } from './escape-string';
import { GameDatContext } from './game-dat-context';
import { MapEventContext } from './map-event-context';

export abstract class TranslationContext implements ICustomKey, IString {
  protected readonly context_: string[] = [];

  enter(name: string) {
    this.context_.push(name);
  }

  leave() {
    if (this.context_.length <= 0) {
      throw new Error('Leaving empty context');
    }
    this.context_.pop();
  }

  static FromString(str: string): TranslationContext {
    const colonIndex = str.indexOf(':');
    if (colonIndex < 0) {
      throw new Error(`Invalid context string: ${str}`);
    }
    const type = str.substring(0, colonIndex);
    const path = safeSplit(str.substring(colonIndex + 1));
    switch (type) {
      case CTX.STR.MPS:
        return MapEventContext.FromPath(path);
      case CTX.STR.DAT:
        return GameDatContext.FromPath(path);
      case CTX.STR.DB:
        return DatabaseContext.FromPath(path);
      case CTX.STR.CE:
        return CommonEventContext.FromPath(path);
      default:
        throw new Error(`Unknown context type: ${type}`);
    }
  }

  abstract get key(): string;
}
