export class ContextBuilder {
  public ctxArr: any[] = [];
  constructor(public patchFile: string) {}

  enter(ctx: any) {
    this.ctxArr.push(ctx);
  }

  leave(ctx?: any) {
    const last = this.ctxArr.pop();
    if (ctx && last !== ctx) {
      throw new Error(`CtxBuilder: Leaving ${ctx} but expected ${last}`);
    }
  }
}
