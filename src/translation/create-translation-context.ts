import { CTX } from '../constants';
import { CommonEventContext } from './common-event-context';
import { DatabaseContext } from './database-context';
import { GameDatContext } from './game-dat-context';
import { MapEventContext } from './map-event-context';
import { safeSplit } from './string-utils';
import { TranslationContext } from './translation-context';

export function ctxFromStr(str: string): TranslationContext {
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
