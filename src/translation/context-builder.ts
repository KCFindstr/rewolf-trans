import { IString } from '../interfaces';
import { TranslationContext } from './translation-context';
import { TranslationString } from './translation-string';

export class ContextPathPart implements IString {
  public index: string;
  constructor(index: IString, public name?: TranslationString) {
    this.index = index.toString();
  }

  toString(): string {
    if (this.name !== undefined) {
      return `[${this.index}]${this.name.text}`;
    }
    return this.index;
  }

  get numIndex(): number {
    return parseInt(this.index, 10);
  }

  set numIndex(value: number) {
    this.index = value.toString();
  }

  static FromString(str: string, translated = true): ContextPathPart {
    const match = str.match(/^\[(\d+)\](.*)$/s);
    if (!match) {
      return new ContextPathPart(str);
    }
    return new ContextPathPart(
      match[1],
      new TranslationString(match[2], translated),
    );
  }
}

export class ContextBuilder {
  public ctxArr: ContextPathPart[] = [];

  /**
   * @param patchFile Prefix of patch file without extension.
   * @param type One of the context types. See CTX.STR
   */
  constructor(public patchFile: string, public type: string) {}

  enter(ctx: string | number, name?: TranslationString) {
    this.ctxArr.push(new ContextPathPart(ctx.toString(), name));
  }

  leave(ctx?: string | number) {
    const last = this.ctxArr.pop();
    if (ctx && last.index !== ctx.toString()) {
      throw new Error(`CtxBuilder: Leaving ${ctx} but expected ${last.index}`);
    }
  }

  build(str: TranslationString): TranslationContext {
    return new TranslationContext(this.type, str, this.ctxArr);
  }
}
