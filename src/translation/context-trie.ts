import { TranslationContext } from './translation-context';

export class ContextTrieNode {
  children: Record<string, ContextTrieNode> = {};

  constructor(protected ctx_?: TranslationContext) {}

  get hasData() {
    return !!this.ctx_;
  }

  get ctx() {
    return this.ctx_;
  }

  set ctx(ctx: TranslationContext) {
    this.ctx_ = ctx;
  }

  *walk(): IterableIterator<TranslationContext> {
    if (this.ctx) {
      yield this.ctx;
    }
    for (const child of Object.values(this.children)) {
      yield* child.walk();
    }
  }
}

export class ContextTrie {
  protected root_ = new ContextTrieNode();

  addCtx(ctx: TranslationContext) {
    let node = this.root_.children[ctx.type];
    if (!node) {
      node = new ContextTrieNode();
      this.root_.children[ctx.type] = node;
    }
    for (const part of ctx.paths) {
      if (!node.children[part.index]) {
        node.children[part.index] = new ContextTrieNode();
      }
      node = node.children[part.index];
    }
    node.ctx = ctx;
  }

  getNode(ctx: TranslationContext): ContextTrieNode {
    let node = this.root_.children[ctx.type];
    if (!node) {
      return null;
    }
    for (const part of ctx.paths) {
      node = node.children[part.index];
      if (!node) {
        return null;
      }
    }
    return node;
  }
}
