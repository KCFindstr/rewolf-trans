import { ICustomKey, IString } from '../interfaces';
import { ContextPathPart } from './context-builder';
import { safeJoin, safeSplit } from './string-utils';
import { TranslationString } from './translation-string';
import { logger } from '../logger';
import { TranslationEntry } from './translation-entry';

export class TranslationContext implements ICustomKey, IString {
  protected entry_: TranslationEntry;
  protected paths_: ContextPathPart[];

  constructor(
    public type: string,
    public text: TranslationString,
    paths: ContextPathPart[] = [],
    entry?: TranslationEntry,
    public isNew: boolean = true,
  ) {
    this.paths = paths;
    this.entry = entry;
  }

  static FromStr(str: string): TranslationContext {
    str = str.trimStart();
    const match = str.match(/^\[([^\]]*)\] (.*)$/s);
    let isNew = false;
    if (match) {
      const params = match[1].split(',');
      isNew = params.includes('NEW');
      str = match[2];
    }
    const colonIndex = str.indexOf(':');
    if (colonIndex < 0) {
      throw new Error(`Invalid context string: ${str}`);
    }
    const type = str.substring(0, colonIndex);
    const paths = safeSplit(str.substring(colonIndex + 1));
    return new TranslationContext(
      type,
      undefined,
      paths.map((path) => ContextPathPart.FromString(path)),
      undefined,
      isNew,
    );
  }

  get paths(): ContextPathPart[] {
    return this.paths_;
  }

  set paths(value: ContextPathPart[]) {
    this.paths_ = [...value];
  }

  get entry(): TranslationEntry {
    return this.entry_;
  }

  set entry(entry: TranslationEntry) {
    if (!this.isTranslated && entry) {
      if (entry.original !== this.text.text) {
        throw new Error(
          `Cannot add translation entry:\n${entry.original}\n<^^^^^ EXISTING ^^^^^ // vvvvv NEW vvvvv>\n${this.text.text}\nContext: ${this.paths}`,
        );
      }
    }
    if (this.entry_) {
      this.entry_.removeCtx(this);
    }
    this.entry_ = entry;
    if (entry) {
      entry.addCtx(this);
    }
  }

  get key(): string {
    return `${this.type}:${safeJoin(this.paths_.map((p) => p.index))}`;
  }

  get isTranslated(): boolean {
    return this.text && this.text.isTranslated;
  }

  get translated(): string {
    return this.isTranslated ? this.text.text : '';
  }

  patch(rhs: TranslationContext): void {
    if (this.key !== rhs.key) {
      throw new Error(
        `Cannot patch translation entry:\n${this.key}\n<==========>\n${rhs.key}`,
      );
    }
    this.isNew = rhs.isNew;
    if (!rhs.isTranslated) {
      return;
    }
    if (this.isTranslated) {
      if (this.translated === rhs.translated) {
        logger.debug(`Same translation overwrite: ${this.key}`);
      } else {
        logger.warn(
          `Translation overwrite: ${this.key}\n${this.translated}\n<^^^^^ EXISTING ^^^^^ // vvvvv NEW vvvvv>\n${rhs.translated}`,
        );
      }
    }
    if (!this.text) {
      logger.debug(`Patching empty translation context ${this.key}`);
      return;
    }
    this.text.patch(rhs.translated);
  }

  toString(): string {
    return `${this.type}:${safeJoin(this.paths_)}`;
  }
}
