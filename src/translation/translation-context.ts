import { ICustomKey, IString } from '../interfaces';
import { ContextPathPart } from './context-builder';
import { safeJoin, safeSplit } from './string-utils';
import { TranslationString } from './translation-string';

export class TranslationContext implements ICustomKey, IString {
  protected paths_: ContextPathPart[];
  protected original_: string;

  constructor(
    public type: string,
    public str: TranslationString,
    paths: ContextPathPart[],
  ) {
    this.paths_ = [...paths];
  }

  static FromStr(str: string) {
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
      throw new Error(`Translation entry already patched: ${this.key}`);
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
