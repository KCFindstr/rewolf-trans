import * as fs from 'fs';
import { WolfContext } from '../archive/wolf-context';
import { REWOLFTRANS_VERSION } from '../constants';
import { ICustomKey, IString } from '../interfaces';
import { compareVersion } from '../util';
import {
  escapeMultiline,
  isTranslatable,
  unescapeMultiline,
} from './string-utils';
import { TranslationContext } from './translation-context';

export class TranslationEntry implements ICustomKey, IString {
  public original: string;
  public translated: string;
  public patchFile: string;
  public ctx: Record<string, TranslationContext> = {};

  get key(): string {
    return this.original;
  }

  get isTranslatable(): boolean {
    return isTranslatable(this.original);
  }

  get isTranslated(): boolean {
    return this.translated.trim().length > 0;
  }

  addCtx(...ctxs: TranslationContext[]) {
    for (const ctx of ctxs) {
      this.ctx[ctx.key] = ctx;
    }
  }

  combineWith(rhs: TranslationEntry) {
    if (this.original !== rhs.original) {
      throw new Error(
        `Cannot combine translation entry:\n${this.original}\n<=>\n${rhs.original}`,
      );
    }
    this.setPatchFileIfEmpty(rhs.patchFile);
    this.setTranslationIfEmpty(rhs.translated);
    this.addCtx(...Object.values(rhs.ctx));
  }

  setTranslationIfEmpty(translation: string) {
    if (!this.isTranslated) {
      this.translated = translation;
    }
  }

  setPatchFileIfEmpty(patchFile: string) {
    if (!this.patchFile) {
      this.patchFile = patchFile;
    }
  }

  toString(): string {
    const ctx = Object.values(this.ctx).sort((a, b) =>
      a.key.localeCompare(b.key),
    );
    const lines: string[] = [
      '> BEGIN STRING',
      escapeMultiline(this.original),
      ...ctx.map((ctx) => `> CONTEXT [NEW] ${ctx.toString()}`),
      escapeMultiline(this.translated),
      '> END STRING',
    ];
    return lines.join('\n');
  }
}

enum LoadPatchFileState {
  None = 'none',
  Oringal = 'oringal',
  Context = 'context',
  Translated = 'translated',
}

export class TranslationDict {
  public entries: Record<string, TranslationEntry> = {};

  private writePatch(patchPath: string, entries: TranslationEntry[]) {
    const patchLines = [
      `> REWOLF TRANS PATCH FILE VERSION ${REWOLFTRANS_VERSION}`,
      '',
    ];
    for (const entry of entries) {
      patchLines.push(entry.toString());
      patchLines.push('');
    }
    fs.writeFileSync(patchPath, patchLines.join('\n'), 'utf8');
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

  public add(original: string, translated: string, patchFile: string) {
    let entry = this.entries[original];
    if (!entry) {
      entry = new TranslationEntry();
      this.entries[original] = entry;
    }
    entry.original = original;
    entry.setTranslationIfEmpty(translated);
    entry.setPatchFileIfEmpty(patchFile);
    this.entries[original] = entry;
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
    let state = LoadPatchFileState.None;
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
          } else if (this.parseInstruction(line, 'BEGIN STRING')[0]) {
            original.splice(0);
            translated.splice(0);
            entry = new TranslationEntry();
            if (state !== LoadPatchFileState.Oringal) {
              throw new Error(`Unexpected BEGIN STRING in state ${state}`);
            }
            state = LoadPatchFileState.Oringal;
          } else if (this.parseInstruction(line, 'END STRING')[0]) {
            entry.original = unescapeMultiline(original.join('\n'));
            entry.translated = unescapeMultiline(translated.join('\n'));
            this.addEntry(entry);
            if (state !== LoadPatchFileState.Translated) {
              throw new Error(`Unexpected END STRING in state ${state}`);
            }
            state = LoadPatchFileState.None;
          } else if (([, str] = this.parseInstruction(line, 'CONTEXT'))) {
            str = str.trimStart();
            if (str.startsWith('[NEW]')) {
              str = str.substring(5).trimStart();
            }
            if (str.endsWith(' < UNUSED')) {
              str = str.substring(0, str.length - 9);
            }
            if (str.endsWith(' < UNTRANSLATED')) {
              str = str.substring(0, str.length - 15);
            }
            entry.addCtx(TranslationContext.FromString(str));
            if (state !== LoadPatchFileState.Oringal) {
              throw new Error(`Unexpected CONTEXT in state ${state}`);
            }
            state = LoadPatchFileState.Context;
          } else {
            this.warn(patchPath, i, `Unknown instruction: ${line}`);
          }
        } catch (e) {
          throw new Error(this.locstr(patchPath, i, e.message));
        }
        continue;
      }
      if (state === LoadPatchFileState.Context) {
        state = LoadPatchFileState.Translated;
      }
      if (state === LoadPatchFileState.None) {
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
    const patchMap: Record<string, TranslationEntry[]> = {};
    for (const entry of Object.values(this.entries)) {
      const patchFile = entry.patchFile;
      if (!patchMap[patchFile]) {
        patchMap[patchFile] = [];
      }
      patchMap[patchFile].push(entry);
    }
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
