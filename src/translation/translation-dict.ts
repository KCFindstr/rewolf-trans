import * as fs from 'fs';
import { WolfContext } from '../archive/wolf-context';
import { REWOLFTRANS_PATCH_VERSION, REWOLFTRANS_VERSION } from '../constants';
import { ICustomKey, IString } from '../interfaces';
import { logger } from '../logger';
import { compareVersion, forceWriteFile, groupBy } from '../util';
import { ContextBuilder } from './context-builder';
import { ContextTrie } from './context-trie';
import {
  escapeMultiline,
  isTranslatable,
  unescapeMultiline,
} from './string-utils';
import { TranslationContext } from './translation-context';
import { TranslationString } from './translation-string';

type LoggerType = (...args: any[]) => void;

export class TranslationEntry implements ICustomKey, IString {
  public original: string;
  public patchFile: string;
  public ctx: Record<string, TranslationContext> = {};

  get key(): string {
    return this.original;
  }

  get isTranslatable(): boolean {
    return isTranslatable(this.original);
  }

  addCtx(...ctxs: TranslationContext[]) {
    for (const ctx of ctxs) {
      if (!ctx) {
        continue;
      }
      const existing = this.ctx[ctx.key];
      if (existing) {
        existing.patch(ctx);
      } else {
        this.ctx[ctx.key] = ctx;
      }
    }
  }

  patchCtx(logger: LoggerType, ...ctxs: TranslationContext[]) {
    for (const ctx of ctxs) {
      if (!ctx) {
        continue;
      }
      const existing = this.ctx[ctx.key];
      if (!existing) {
        logger(`Context not found: ${ctx.key}`);
        continue;
      }
      existing.patch(ctx);
    }
  }

  addEntry(rhs: TranslationEntry) {
    if (this.original !== rhs.original) {
      throw new Error(
        `Cannot add translation entry:\n${this.original}\n<^^^^^ EXISTING ^^^^^ // vvvvv NEW vvvvv>\n${rhs.original}`,
      );
    }
    this.setPatchFileIfEmpty(rhs.patchFile);
    this.addCtx(...Object.values(rhs.ctx));
  }

  patchEntry(logger: LoggerType, rhs: TranslationEntry) {
    this.setPatchFileIfEmpty(rhs.patchFile);
    this.patchCtx(logger, ...Object.values(rhs.ctx));
  }

  setPatchFileIfEmpty(patchFile: string) {
    if (!this.patchFile && patchFile) {
      this.patchFile = patchFile;
    }
  }

  toString(): string {
    const ctxArr = Object.values(this.ctx);
    const validTranslated = ctxArr.find((ctx) => ctx.isTranslated);
    if (validTranslated) {
      ctxArr
        .filter((ctx) => !ctx.isTranslated)
        .forEach((ctx) => ctx.str.patch(validTranslated.translated));
    }
    const ctxs = groupBy(ctxArr, (ctx) => ctx.translated);
    const lines: string[] = [];
    for (const translated in ctxs) {
      const arr = ctxs[translated];
      const prefix = translated ? `CONTEXT` : `CONTEXT [NEW]`;
      arr.sort((a, b) => a.key.localeCompare(b.key));
      lines.push(
        '> BEGIN STRING',
        escapeMultiline(this.original),
        ...arr.map((ctx) => `> ${prefix} ${ctx.toString()}`),
        escapeMultiline(translated),
        '> END STRING',
        '',
      );
    }
    if (lines.length > 0) {
      lines.pop();
    }
    return lines.join('\n');
  }
}

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

  public add(original: string, patchFile: string, context: TranslationContext) {
    if (!isTranslatable(original)) {
      return;
    }
    let entry = this.entries[original];
    if (!entry) {
      entry = new TranslationEntry();
      this.entries[original] = entry;
    }
    entry.original = original;
    entry.setPatchFileIfEmpty(patchFile);
    entry.addCtx(context);
    this.ctxTrie.addCtx(entry, context);
  }

  public patch(context: TranslationContext) {
    const node = this.ctxTrie.getNode(context);
    if (!node || !node.hasData) {
      this.warn(`Node not found: ${context.key}`);
      return;
    }
    node.entry.patchCtx(this.warn.bind(this), context);
  }

  public addTexts(ctxBuilder: ContextBuilder, texts: TranslationString[]) {
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      ctxBuilder.enter(i);
      this.add(text.text, ctxBuilder.patchFile, ctxBuilder.build(text));
      ctxBuilder.leave(i);
    }
  }

  public addEntry(entry: TranslationEntry) {
    if (!entry.isTranslatable) {
      return;
    }
    const existingEntry = this.entries[entry.original];
    if (existingEntry) {
      existingEntry.addEntry(entry);
    } else {
      this.entries[entry.original] = entry;
    }
  }

  public patchEntry(entry: TranslationEntry) {
    const contexts = Object.values(entry.ctx);
    if (!entry.isTranslatable || contexts.length === 0) {
      return;
    }
    const first = contexts[0];
    const node = this.ctxTrie.getNode(first);
    if (!node || !node.hasData) {
      this.warn(`Node not found: ${first.key}`);
      return;
    }
    node.entry.patchEntry(this.warn.bind(this), entry);
  }

  public load(patchPath: string) {
    this.filename_ = patchPath;
    const text = fs.readFileSync(patchPath, 'utf8');
    const lines = text.split('\n');
    let entry: TranslationEntry;
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
            entry = new TranslationEntry();
            if (state !== LoadPatchFileState.Blank) {
              throw new Error(`Unexpected BEGIN STRING in state ${state}`);
            }
            state = LoadPatchFileState.Oringal;
          } else if (this.parseInstruction(line, 'END STRING')[0]) {
            // End string
            let translatedStr = translated.join('\n');
            if (translatedStr) {
              translatedStr = unescapeMultiline(translatedStr);
              Object.values(entry.ctx).forEach((ctx) => {
                ctx.str = new TranslationString(translatedStr, true);
              });
              this.patchEntry(entry);
            }
            if (state !== LoadPatchFileState.Translated) {
              throw new Error(`Unexpected END STRING in state ${state}`);
            }
            state = LoadPatchFileState.Blank;
          } else if (([, str] = this.parseInstruction(line, 'CONTEXT'))) {
            // Load context
            if (
              state !== LoadPatchFileState.Oringal &&
              state !== LoadPatchFileState.Context
            ) {
              throw new Error(`Unexpected CONTEXT in state ${state}`);
            }
            entry.original = unescapeMultiline(original.join('\n'));
            str = str.trimStart();
            const match = str.match(/^\[[^\]]*\] (.*)$/s);
            if (match) {
              str = match[1];
            }
            if (format === PatchFormat.RewolfTrans) {
              entry.addCtx(TranslationContext.FromStr(str));
            } else if (format === PatchFormat.WolfTrans) {
              entry.addCtx(
                TranslationContext.FromLegacyStr(str, entry.original, this),
              );
            } else {
              throw new Error('Unknown patch format while parsing CONTEXT');
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
