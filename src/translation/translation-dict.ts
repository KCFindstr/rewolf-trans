import { ICustomKey, IString } from '../interfaces';
import { escapeMultiline, isTranslatable } from './string-utils';
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

  addCtx(...ctxs: TranslationContext[]) {
    for (const ctx of ctxs) {
      this.ctx[ctx.key] = ctx;
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
      ...ctx.map((ctx) => `> CONTEXT ${ctx.toString()}`),
      this.translated,
      '> END STRING',
    ];
    return lines.join('\n');
  }
}

export class TranslationDict {
  public entries: Record<string, TranslationEntry> = {};

  public add(original: string, translated: string, patchFile: string) {
    let entry = this.entries[original];
    if (!entry) {
      entry = new TranslationEntry();
      this.entries[original] = entry;
    }
    entry.original = original;
    entry.translated = translated;
    entry.setPatchFileIfEmpty(patchFile);
    this.entries[original] = entry;
  }

  public addEntry(entry: TranslationEntry) {
    const existingEntry = this.entries[entry.original];
    if (existingEntry) {
      existingEntry.addCtx(...Object.values(entry.ctx));
    } else {
      this.entries[entry.original] = entry;
    }
  }
}
