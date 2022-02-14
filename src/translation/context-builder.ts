import * as path from 'path/posix';
import { IString } from '../interfaces';
import { TranslationContext } from './translation-context';
import { TranslationString } from './translation-string';

export class ContextPathPart implements IString {
  public index: string;
  constructor(index: IString, public name?: string) {
    this.index = index.toString();
  }

  toString(): string {
    if (this.name !== undefined) {
      return `[${this.index}]${this.name}`;
    }
    return this.index;
  }

  get numIndex(): number {
    return parseInt(this.index, 10);
  }

  set numIndex(value: number) {
    this.index = value.toString();
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
  public patchPath: string[] = [];

  /**
   * @param patchFile Prefix of patch file without extension.
   * @param type One of the context types. See CTX.STR
   */
  constructor(public type: string) {}

  get patchFile(): string {
    return path.join(...this.patchPath);
  }

  enterPatch(patch: string) {
    this.patchPath.push(patch);
  }

  leavePatch(patch: string) {
    const last = this.patchPath.pop();
    if (last !== patch) {
      throw new Error(
        `CtxBuilder: Leaving patch ${patch} but expected ${last}`,
      );
    }
  }

  enter(ctx: string | number, name?: string) {
    this.ctxArr.push(new ContextPathPart(ctx.toString(), name));
  }

  leave(ctx: string | number) {
    const last = this.ctxArr.pop();
    if (ctx && last.index !== ctx.toString()) {
      throw new Error(`CtxBuilder: Leaving ${ctx} but expected ${last.index}`);
    }
  }

  build(str: TranslationString): TranslationContext {
    return new TranslationContext(this.type, str, this.ctxArr);
  }
}
