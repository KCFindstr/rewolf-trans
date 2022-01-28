import { IString } from '../interfaces';
import { TranslationContext } from './translation-context';

export class ContextPathPart implements IString {
  constructor(public index: string, public name?: string) {}

  toString(): string {
    if (this.name !== undefined) {
      return `[${this.index}]${this.name}`;
    }
    return this.index;
  }

  static FromString(str: string): ContextPathPart {
    const match = str.match(/^\[(\d+)\](.*)$/s);
    if (!match) {
      return new ContextPathPart(str);
    }
    return new ContextPathPart(match[1], match[2]);
  }
}

export class ContextBuilder {
  public ctxArr: ContextPathPart[] = [];
  constructor(public patchFile: string, public type: string) {}

  enter(ctx: string | number, name?: string) {
    this.ctxArr.push(new ContextPathPart(ctx.toString(), name));
  }

  leave(ctx?: string | number) {
    const last = this.ctxArr.pop();
    if (ctx && last.index !== ctx.toString()) {
      throw new Error(`CtxBuilder: Leaving ${ctx} but expected ${last.index}`);
    }
  }

  build(): TranslationContext {
    return new TranslationContext(this.type, this.ctxArr);
  }
}
