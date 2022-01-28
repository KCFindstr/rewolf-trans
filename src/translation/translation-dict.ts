import * as fs from 'fs';
import { WolfContext } from '../archive/wolf-context';
import { REWOLFTRANS_PATCH_VERSION, REWOLFTRANS_VERSION } from '../constants';
import { ICustomKey, IString, ITranslationText } from '../interfaces';
import { compareVersion, forceWriteFile, groupBy } from '../util';
import { ctxFromStr } from './create-translation-context';
import {
  escapeMultiline,
  isTranslatable,
  unescapeMultiline,
} from './string-utils';
import { TranslationContext } from './translation-context';

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
      const existing = this.ctx[ctx.key];
      if (existing) {
        existing.patch(this.original, ctx);
      } else {
        this.ctx[ctx.key] = ctx;
      }
    }
  }

  combineWith(rhs: TranslationEntry) {
    if (this.original !== rhs.original) {
      throw new Error(
        `Cannot combine translation entry:\n${this.original}\n<=>\n${rhs.original}`,
      );
    }
    this.setPatchFileIfEmpty(rhs.patchFile);
    this.addCtx(...Object.values(rhs.ctx));
  }

  setPatchFileIfEmpty(patchFile: string) {
    if (!this.patchFile && patchFile) {
      this.patchFile = patchFile;
    }
  }

  toString(): string {
    const ctxs = groupBy(Object.values(this.ctx), (ctx) => ctx.translated);
    const lines: string[] = [];
    for (const translated in ctxs) {
      const arr = ctxs[translated];
      arr.sort((a, b) => a.key.localeCompare(b.key));
      lines.push(
        '> BEGIN STRING',
        escapeMultiline(this.original),
        ...arr.map((ctx) => `> CONTEXT [NEW] ${ctx.toString()}`),
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

export class TranslationDict {
  public entries: Record<string, TranslationEntry> = {};

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
    console.log(`Patch file ${patchPath} will be overwritten.`);
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

  private locstr(file: string, line: number, msg: string) {
    return `${file}:${line + 1} > ${msg}`;
  }

  private warn(file: string, line: number, msg: string) {
    console.warn(this.locstr(file, line, msg));
  }

  private log(file: string, line: number, msg: string) {
    console.log(this.locstr(file, line, msg));
  }

  public add(original: string, patchFile: string, context: TranslationContext) {
    let entry = this.entries[original];
    if (!entry) {
      entry = new TranslationEntry();
      this.entries[original] = entry;
    }
    entry.original = original;
    entry.setPatchFileIfEmpty(patchFile);
    entry.addCtx(context);
    this.entries[original] = entry;
  }

  public addSupplier(
    supplier: ITranslationText,
    patchFile: string,
    ctx: TranslationContext,
  ) {
    const texts = supplier.getTexts();
    texts
      .filter((text) => isTranslatable(text))
      .forEach((text) => this.add(text, patchFile, ctx));
    ctx.withPatchCallback((original, translated) => {
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (text === original) {
          supplier.patchText(i, translated);
        }
      }
    });
  }

  public addEntry(entry: TranslationEntry) {
    const existingEntry = this.entries[entry.original];
    if (existingEntry) {
      existingEntry.combineWith(entry);
    } else {
      this.entries[entry.original] = entry;
    }
  }

  public load(patchPath: string) {
    const text = fs.readFileSync(patchPath, 'utf8');
    const lines = text.split('\n');
    let entry: TranslationEntry;
    const original: string[] = [];
    const translated: string[] = [];
    let state = LoadPatchFileState.Header;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (this.isComment(line)) {
        continue;
      }
      if (this.isInstruction(line)) {
        try {
          let str: string;
          if (this.parseInstruction(line, 'WOLF TRANS PATCH FILE VERSION')[0]) {
            this.warn(
              patchPath,
              i,
              'Parsing wolf trans patch file; might be incompatible',
            );
            if (state !== LoadPatchFileState.Header) {
              throw new Error(`Unexpected header in state ${state}`);
            }
            state = LoadPatchFileState.Blank;
          } else if (
            ([, str] = this.parseInstruction(
              line,
              'REWOLF TRANS PATCH FILE VERSION',
            ))[0]
          ) {
            str = str.trim();
            if (compareVersion(REWOLFTRANS_VERSION, str) < 0) {
              throw new Error(
                `Cannot parse patch ver ${str} with current ver ${REWOLFTRANS_VERSION}`,
              );
            }
            if (state !== LoadPatchFileState.Header) {
              throw new Error(`Unexpected header in state ${state}`);
            }
            state = LoadPatchFileState.Blank;
          } else if (state === LoadPatchFileState.Header) {
            // Not a patch file
            return;
          } else if (this.parseInstruction(line, 'BEGIN STRING')[0]) {
            original.splice(0);
            translated.splice(0);
            entry = new TranslationEntry();
            if (state !== LoadPatchFileState.Blank) {
              throw new Error(`Unexpected BEGIN STRING in state ${state}`);
            }
            state = LoadPatchFileState.Oringal;
          } else if (this.parseInstruction(line, 'END STRING')[0]) {
            entry.original = unescapeMultiline(original.join('\n'));
            Object.values(entry.ctx).forEach((ctx) => {
              ctx.translated = unescapeMultiline(translated.join('\n'));
            });
            this.addEntry(entry);
            if (state !== LoadPatchFileState.Translated) {
              throw new Error(`Unexpected END STRING in state ${state}`);
            }
            state = LoadPatchFileState.Blank;
          } else if (([, str] = this.parseInstruction(line, 'CONTEXT'))) {
            str = str.trimStart();
            const match = str.match(/^\[[^\]]*\] (.*)$/s);
            if (match) {
              str = match[1];
            }
            if (str.endsWith(' < UNUSED')) {
              str = str.substring(0, str.length - 9);
            }
            if (str.endsWith(' < UNTRANSLATED')) {
              str = str.substring(0, str.length - 15);
            }
            entry.addCtx(ctxFromStr(str));
            if (
              state !== LoadPatchFileState.Oringal &&
              state !== LoadPatchFileState.Context
            ) {
              throw new Error(`Unexpected CONTEXT in state ${state}`);
            }
            state = LoadPatchFileState.Context;
          } else {
            this.warn(patchPath, i, `Unknown instruction: ${line}`);
          }
        } catch (e) {
          e.message = `${patchPath}:${i + 1}: ${e.message}`;
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
          this.warn(patchPath, i, 'Unexpected line in blank');
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
