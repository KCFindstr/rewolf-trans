import { ICustomKey, IString } from '../interfaces';

type PatchCallbackFn = (original: string, translated: string) => void;

export abstract class TranslationContext implements ICustomKey, IString {
  protected patchCallback_?: PatchCallbackFn;
  public translated = '';

  abstract get key(): string;

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
}
