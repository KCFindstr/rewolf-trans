import { ICustomKey, IString } from '../interfaces';
import { ContextPathPart } from './context-builder';
import { safeJoin, safeSplit } from './string-utils';

type PatchCallbackFn = (original: string, translated: string) => void;

export class TranslationContext implements ICustomKey, IString {
  protected patchCallback_?: PatchCallbackFn;
  protected paths_: ContextPathPart[];
  public translated = '';

  constructor(public type: string, paths: ContextPathPart[]) {
    this.paths_ = [...paths];
  }

  static FromStr(str: string) {
    const colonIndex = str.indexOf(':');
    if (colonIndex < 0) {
      throw new Error(`Invalid context string: ${str}`);
    }
    const type = str.substring(0, colonIndex);
    const paths = safeSplit(str.substring(colonIndex + 1));
    return new TranslationContext(type, paths.map(ContextPathPart.FromString));
  }

  get key(): string {
    return `${this.type}:${safeJoin(this.paths_.map((p) => p.index))}`;
  }

  get isTranslated(): boolean {
    return this.translated && this.translated.trim().length > 0;
  }

  withPatchCallback(callback: PatchCallbackFn): TranslationContext {
    this.patchCallback_ = callback;
    return this;
  }

  patch(original: string, rhs: TranslationContext): void {
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
    this.translated = rhs.translated;
    if (this.patchCallback_) {
      this.patchCallback_(original, this.translated);
    } else {
      console.log(`Ctx missing patch callback: ${this.key}`);
    }
  }

  toString(): string {
    return `${this.type}:${safeJoin(this.paths_)}`;
  }
}
