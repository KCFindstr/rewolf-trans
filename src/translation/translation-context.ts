export class TranslationContext {
  protected readonly context_: string[] = [];

  enter(name: string) {
    this.context_.push(name);
  }

  leave() {
    if (this.context_.length <= 0) {
      throw new Error('Leaving empty context');
    }
    this.context_.pop();
  }
}
