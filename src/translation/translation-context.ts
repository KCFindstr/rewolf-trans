import { ICustomKey, IString } from '../interfaces';

type PatchCallbackFn = (original: string, translated: string) => void;

export abstract class TranslationContext implements ICustomKey, IString {
  protected patchCallback_?: PatchCallbackFn;

  abstract get key(): string;

  withPatchCallback(callback: PatchCallbackFn): TranslationContext {
    this.patchCallback_ = callback;
    return this;
  }

  patch(original: string, translated: string): void {
    if (this.patchCallback_) {
      this.patchCallback_(original, translated);
    } else {
      console.log(`Ctx missing patch callback: ${this.key}`);
    }
  }
}
