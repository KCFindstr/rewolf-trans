import { ICustomKey, IString } from '../interfaces';
import { groupBy } from '../util';
import { isTranslatable, escapeMultiline } from './string-utils';
import { TranslationContext } from './translation-context';

export enum EntryDangerLevel {
  Extra = 'Extra',
  Normal = 'Normal',
  Warn = 'Warn',
  Danger = 'Danger',
}

export class TranslationEntry implements ICustomKey, IString {
  protected patchFilePrefix_: string;
  public original: string;
  public dangerLevel: EntryDangerLevel = EntryDangerLevel.Normal;
  public ctxs: TranslationContext[] = [];

  static ParseKey(original: string, dangerLevel: EntryDangerLevel) {
    return `${original}/${dangerLevel}`;
  }

  get patchFilePrefix(): string {
    return this.patchFilePrefix_;
  }

  set patchFilePrefix(prefix: string) {
    this.patchFilePrefix_ = prefix;
  }

  get patchFile(): string {
    if (this.dangerLevel === EntryDangerLevel.Normal) {
      return `${this.patchFilePrefix_}.txt`;
    }
    return `${this.patchFilePrefix_}_${this.dangerLevel}.txt`;
  }

  get key(): string {
    return TranslationEntry.ParseKey(this.patchFilePrefix_, this.dangerLevel);
  }

  get isTranslatable(): boolean {
    return isTranslatable(this.original);
  }

  public addCtx(ctx: TranslationContext) {
    this.ctxs.push(ctx);
  }

  public removeCtx(ctx: TranslationContext) {
    const index = this.ctxs.indexOf(ctx);
    if (index >= 0) {
      this.ctxs.splice(index, 1);
    }
  }

  public setPatchFilePrefixIfEmpty(patchFile: string) {
    if (!this.patchFilePrefix_ && patchFile) {
      this.patchFilePrefix_ = patchFile;
    }
  }

  public toString(): string {
    const validTranslated = this.ctxs.find((ctx) => ctx.isTranslated);
    if (validTranslated) {
      this.ctxs
        .filter((ctx) => !ctx.isTranslated)
        .forEach((ctx) => ctx.text.patch(validTranslated.translated));
    }
    const ctxs = groupBy(this.ctxs, (ctx) => ctx.translated);
    const lines: string[] = [];
    for (const translated in ctxs) {
      const arr = ctxs[translated];
      arr.sort((a, b) => a.key.localeCompare(b.key));
      lines.push(
        '> BEGIN STRING',
        escapeMultiline(this.original),
        ...arr.map((ctx) => {
          const prefix = ctx.isNew ? `CONTEXT [NEW]` : `CONTEXT`;
          return `> ${prefix} ${ctx.toString()}`;
        }),
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
