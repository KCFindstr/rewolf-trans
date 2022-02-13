import * as fs from 'fs';
import { WolfContext } from '../operation/wolf-context';
import { REWOLFTRANS_PATCH_VERSION, REWOLFTRANS_VERSION } from '../constants';
import { logger } from '../logger';
import { compareVersion, forceWriteFile, groupBy } from '../util';
import { ContextBuilder } from './context-builder';
import { ContextTrie } from './context-trie';
import { isTranslatable, unescapeMultiline } from './string-utils';
import { TranslationContext } from './translation-context';
import { PatchFileCategory, TranslationEntry } from './translation-entry';
import { TranslationString } from './translation-string';
import { ReadWolftransContext } from '../wolf/read-wolftrans-context';

enum LoadPatchFileState {
  Header = 'header',
  Blank = 'blank',
  Oringal = 'oringal',
  Context = 'context',
  Translated = 'translated',
}

enum PatchFormat {
  None,
  WolfTrans,
  RewolfTrans,
}

export class TranslationDict {
  public entries: Record<string, TranslationEntry> = {};
  public ctxTrie = new ContextTrie();
  private filename_: string;
  private lineNum_: number;

  private writePatch(patchPath: string, entries: TranslationEntry[]) {
    const patchLines = [
      `> REWOLF TRANS PATCH FILE VERSION ${REWOLFTRANS_PATCH_VERSION}`,
      '',
    ];
    for (const entry of entries) {
      patchLines.push(entry.toString());
      patchLines.push('');
    }
    forceWriteFile(patchPath, patchLines.join('\n'), 'utf8');
  }

  private updatePatch(patchPath: string, entries: TranslationEntry[]) {
    // TODO: Only update new contents
    logger.debug(`Patch file ${patchPath} will be overwritten.`);
    this.writePatch(patchPath, entries);
  }

  private isComment(line: string): boolean {
    return line.startsWith('#');
  }

  private isInstruction(line: string): boolean {
    return line.startsWith('>');
  }

  private parseInstruction(line: string, tryInst: string): [boolean, string] {
    if (line.startsWith('> ' + tryInst)) {
      return [true, line.substring(tryInst.length + 2)];
    }
    return [false, null];
  }

  public locstr(msg: string) {
    return `${this.filename_}:${this.lineNum_ + 1} > ${msg}`;
  }

  public warn(msg: string) {
    logger.warn(this.locstr(msg));
  }

  public info(msg: string) {
    logger.info(this.locstr(msg));
  }

  public debug(msg: string) {
    logger.debug(this.locstr(msg));
  }

  public add(
    original: string,
    level: PatchFileCategory,
    patchFile: string,
    context: TranslationContext,
  ): boolean {
    if (!isTranslatable(original)) {
      return false;
    }
    const key = TranslationEntry.ParseKey(original, level);
    let entry = this.entries[key];
    if (!entry) {
      entry = new TranslationEntry();
      entry.original = original;
      entry.category = level;
      this.entries[key] = entry;
    }
    entry.setPatchFilePrefixIfEmpty(patchFile);
    this.ctxTrie.addCtx(context);
    context.entry = entry;
    return true;
  }

  public addTexts(
    ctxBuilder: ContextBuilder,
    category: PatchFileCategory,
    texts: TranslationString[],
  ) {
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      ctxBuilder.enter(i);
      this.add(
        text.text,
        category,
        ctxBuilder.patchFile,
        ctxBuilder.build(text),
      );
      ctxBuilder.leave(i);
    }
  }

  public patch(...contexts: TranslationContext[]) {
    for (const ctx of contexts) {
      const node = this.ctxTrie.getNode(ctx);
      if (!node?.hasData) {
        this.warn(`Node not found: ${ctx.key}`);
        return;
      }
      node.ctx.patch(ctx);
    }
  }

  public load(patchPath: string) {
    this.filename_ = patchPath;
    const text = fs.readFileSync(patchPath, 'utf8');
    const lines = text.split('\n');
    const contexts: TranslationContext[] = [];
    const original: string[] = [];
    const translated: string[] = [];
    let state = LoadPatchFileState.Header;
    let format = PatchFormat.None;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      this.lineNum_ = i;
      if (this.isComment(line)) {
        continue;
      }
      if (this.isInstruction(line)) {
        try {
          let str: string;
          if (this.parseInstruction(line, 'WOLF TRANS PATCH FILE VERSION')[0]) {
            // Legacy header
            this.debug('Parsing wolf trans patch file; might be incompatible');
            if (
              state !== LoadPatchFileState.Header ||
              format !== PatchFormat.None
            ) {
              throw new Error(`Unexpected header in state ${state}`);
            }
            format = PatchFormat.WolfTrans;
            state = LoadPatchFileState.Blank;
          } else if (
            ([, str] = this.parseInstruction(
              line,
              'REWOLF TRANS PATCH FILE VERSION',
            ))[0]
          ) {
            // RewolfTrans header
            str = str.trim();
            if (compareVersion(REWOLFTRANS_VERSION, str) < 0) {
              throw new Error(
                `Cannot parse patch ver ${str} with current ver ${REWOLFTRANS_VERSION}`,
              );
            }
            if (
              state !== LoadPatchFileState.Header ||
              format !== PatchFormat.None
            ) {
              throw new Error(`Unexpected header in state ${state}`);
            }
            format = PatchFormat.RewolfTrans;
            state = LoadPatchFileState.Blank;
          } else if (state === LoadPatchFileState.Header) {
            // Not a patch file
            return;
          } else if (this.parseInstruction(line, 'BEGIN STRING')[0]) {
            // Begin string
            original.splice(0);
            translated.splice(0);
            contexts.splice(0);
            if (state !== LoadPatchFileState.Blank) {
              throw new Error(`Unexpected BEGIN STRING in state ${state}`);
            }
            state = LoadPatchFileState.Oringal;
          } else if (this.parseInstruction(line, 'END STRING')[0]) {
            // End string
            if (state !== LoadPatchFileState.Translated) {
              throw new Error(`Unexpected END STRING in state ${state}`);
            }
            let translatedStr = translated.join('\n');
            if (translatedStr) {
              translatedStr = unescapeMultiline(translatedStr);
              contexts.forEach((ctx) => {
                ctx.text = new TranslationString(translatedStr, true);
              });
            }
            this.patch(...contexts);
            state = LoadPatchFileState.Blank;
          } else if (([, str] = this.parseInstruction(line, 'CONTEXT'))) {
            // Load context
            if (
              state !== LoadPatchFileState.Oringal &&
              state !== LoadPatchFileState.Context
            ) {
              throw new Error(`Unexpected CONTEXT in state ${state}`);
            }
            let ctx: TranslationContext;
            if (format === PatchFormat.RewolfTrans) {
              ctx = TranslationContext.FromStr(str);
            } else if (format === PatchFormat.WolfTrans) {
              const originalStr = unescapeMultiline(original.join('\n'));
              ctx = ReadWolftransContext(str, originalStr, this);
            } else {
              throw new Error('Unknown patch format while parsing CONTEXT');
            }
            if (ctx) {
              contexts.push(ctx);
            }
            state = LoadPatchFileState.Context;
          } else {
            this.warn(`Unknown instruction: ${line}`);
          }
        } catch (e) {
          e.message = this.locstr(e.message ? e.message.toString() : '');
          throw e;
        }
        continue;
      }
      if (state === LoadPatchFileState.Header) {
        if (line.trim().length === 0) {
          continue;
        }
        // Not a patch file
        return;
      }
      if (state === LoadPatchFileState.Context) {
        state = LoadPatchFileState.Translated;
      }
      if (state === LoadPatchFileState.Blank) {
        if (line.trim().length !== 0) {
          this.warn('Unexpected line in blank');
        }
      } else if (state === LoadPatchFileState.Oringal) {
        original.push(line);
      } else if (state === LoadPatchFileState.Translated) {
        translated.push(line);
      }
    }
  }

  public write() {
    const patchMap = groupBy(
      Object.values(this.entries),
      (entry) => entry.patchFile,
    );
    // Here patchMap is already finalized, so if any new entrioes are added,
    // they won't be written to the patch file. Only new contexts added to
    // existing entries will take effect.
    // This might result in some contexts missing patch callback.
    Object.keys(patchMap)
      .map((file) => WolfContext.pathResolver.patchPath(file))
      .filter((patchPath) => fs.existsSync(patchPath))
      .forEach((patchPath) => {
        this.load(patchPath);
      });
    for (const patchFile in patchMap) {
      const patchPath = WolfContext.pathResolver.patchPath(patchFile);
      if (fs.existsSync(patchPath)) {
        this.updatePatch(patchPath, patchMap[patchFile]);
      } else {
        this.writePatch(patchPath, patchMap[patchFile]);
      }
    }
  }
}
