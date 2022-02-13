import { findBestMatch } from 'string-similarity';
import { ContextPathPart } from '../translation/context-builder';
import { isTranslatable } from '../translation/string-utils';
import { TranslationContext } from '../translation/translation-context';
import { TranslationDict } from '../translation/translation-dict';
import { CTX } from './constants';

function MatchCtx(
  original: string,
  dict: TranslationDict,
  toMatch: TranslationContext,
): TranslationContext {
  if (!isTranslatable(original)) {
    dict.debug(`Text not translatable, ignored: ${toMatch.paths}`);
    return null;
  }
  const node = dict.ctxTrie.getNode(toMatch);
  if (!node) {
    dict.warn(`Cannot locate on trie: ${toMatch.paths}`);
    return null;
  }
  const candidates = [...node.walk()];
  if (candidates.length === 0) {
    dict.warn(`No text found under context: ${toMatch.paths}`);
    return null;
  }
  const matchTexts = candidates.map((candidate) => candidate.entry.original);
  const bestMatch = findBestMatch(original, matchTexts);
  if (bestMatch.bestMatch.rating <= 0.999) {
    dict.info(
      `Vague match for\n${original}\n<^^^^^ PATCH ^^^^^ // vvvvv GAME vvvvv>\n${bestMatch.bestMatch.target}`,
    );
  }
  return candidates[bestMatch.bestMatchIndex];
}

export function ReadWolftransContext(
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
  const ret = new TranslationContext(ctx.type, ctx.text);
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
    newPaths.push(new ContextPathPart(cmdIndex));
    newPaths.push(new ContextPathPart(commandName));
  } else if (ctx.type === CTX.STR.MPS) {
    if (paths.length !== 7) {
      throw new Error(`Invalid MPS context: ${paths}`);
    }
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
    newPaths.push(new ContextPathPart(cmdIndex));
    newPaths.push(new ContextPathPart(commandName));
  } else {
    throw new Error(`Cannot parse legacy context type: ${ctx.type}`);
  }

  // Find best match in dict
  const match = MatchCtx(original, dict, ret);
  if (!match) {
    return null;
  }
  ret.paths = match.paths;
  return ret;
}
