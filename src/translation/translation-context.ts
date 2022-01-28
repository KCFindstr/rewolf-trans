import { CTX } from '../constants';
import { ICustomKey, IString } from '../interfaces';
import { ContextPathPart } from './context-builder';
import { safeJoin, safeSplit } from './string-utils';
import { TranslationDict } from './translation-dict';
import { TranslationString } from './translation-string';
import { findBestMatch } from 'string-similarity';

function MatchCtx(
  original: string,
  contexts: Record<string, TranslationContext[]>,
  toMatch: TranslationContext,
): TranslationContext {
  const candidates: Record<string, TranslationContext> = {};
  for (const text in contexts) {
    const existingCtxs = contexts[text];
    for (const existingCtx of existingCtxs) {
      if (existingCtx.key.includes(toMatch.key)) {
        candidates[text] = existingCtx;
        break;
      }
    }
  }
  const matchTexts = Object.keys(candidates);
  if (matchTexts.length === 0) {
    return null;
  }
  const bestMatch = findBestMatch(original, matchTexts);
  if (bestMatch.bestMatch.rating <= 0.5) {
    return null;
  }
  return candidates[bestMatch.bestMatch.target];
}

export class TranslationContext implements ICustomKey, IString {
  protected paths_: ContextPathPart[];
  protected original_: string;

  constructor(
    public type: string,
    public str: TranslationString,
    paths: ContextPathPart[] = [],
  ) {
    this.paths = paths;
  }

  static FromStr(str: string): TranslationContext {
    const colonIndex = str.indexOf(':');
    if (colonIndex < 0) {
      throw new Error(`Invalid context string: ${str}`);
    }
    const type = str.substring(0, colonIndex);
    const paths = safeSplit(str.substring(colonIndex + 1));
    return new TranslationContext(
      type,
      undefined,
      paths.map(ContextPathPart.FromString),
    );
  }

  static FromLegacyStr(
    str: string,
    original: string,
    dict: TranslationDict,
  ): TranslationContext {
    if (str.endsWith(' < UNUSED')) {
      str = str.substring(0, str.length - 9);
    }
    if (str.endsWith(' < UNTRANSLATED')) {
      str = str.substring(0, str.length - 15);
    }
    const ctx = TranslationContext.FromStr(str);
    const ret = new TranslationContext(ctx.type, ctx.str);
    const paths = ctx.paths;
    if (ctx.type === CTX.STR.DB) {
      if (paths.length !== 4) {
        throw new Error(`Invalid DB context: ${paths}`);
      }
      ret.paths = paths;
    } else if (ctx.type === CTX.STR.CE) {
      if (paths.length !== 3) {
        throw new Error(`Invalid CommonEvent context: ${paths}`);
      }
      const newPaths = ret.paths;
      const eventId = paths[0].index;
      const cmdIndex = paths[1].numIndex - 1;
      const commandName = paths[2].index;
      newPaths.push(new ContextPathPart(eventId));
      newPaths.push(new ContextPathPart('cmd'));
      newPaths.push(new ContextPathPart(cmdIndex, commandName));
    } else if (ctx.type === CTX.STR.MPS) {
      if (paths.length !== 7) {
        throw new Error(`Invalid MPS context: ${paths}`);
      }
      const ret = new TranslationContext(ctx.type, ctx.str);
      const newPaths = ret.paths;
      const mapName = paths[0].index;
      const eventsStr = paths[1].index;
      const eventNum = paths[2].numIndex;
      const pagesStr = paths[3].index;
      const pageNum = paths[4].numIndex - 1;
      const cmdIndex = paths[5].numIndex - 1;
      const commandName = paths[6].index;
      if (eventsStr !== 'events' || pagesStr !== 'pages') {
        throw new Error(`Invalid element in MPS context: ${paths}`);
      }
      newPaths.push(new ContextPathPart(mapName));
      newPaths.push(new ContextPathPart(eventNum));
      newPaths.push(new ContextPathPart(pageNum));
      newPaths.push(new ContextPathPart(cmdIndex, commandName));
    } else {
      throw new Error(`Cannot parse legacy context type: ${ctx.type}`);
    }

    // Find best match in dict
    const contexts = dict.contexts;
    const match = MatchCtx(original, contexts, ret);
    if (!match) {
      console.log(`No match context for ${paths}`);
      return null;
    }
    ret.paths = match.paths;
    return ret;
  }

  get paths(): ContextPathPart[] {
    return this.paths_;
  }

  set paths(value: ContextPathPart[]) {
    this.paths_ = [...value];
  }

  get key(): string {
    return `${this.type}:${safeJoin(this.paths_.map((p) => p.index))}`;
  }

  get isTranslated(): boolean {
    return this.str && this.str.isTranslated;
  }

  get translated(): string {
    return this.isTranslated ? this.str.text : '';
  }

  patch(rhs: TranslationContext): void {
    if (this.key !== rhs.key) {
      throw new Error(
        `Cannot patch translation entry:\n${this.key}\n<=>\n${rhs.key}`,
      );
    }
    if (!rhs.isTranslated) {
      return;
    }
    if (this.isTranslated) {
      console.warn(`Translation overwrite: ${this.key}`);
    }
    if (!this.str) {
      console.warn(`Patching empty translation context ${this.key}`);
      return;
    }
    this.str.patch(rhs.translated);
  }

  toString(): string {
    return `${this.type}:${safeJoin(this.paths_)}`;
  }
}
