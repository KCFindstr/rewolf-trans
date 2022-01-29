import { CTX } from '../constants';
import { TranslationContext } from './translation-context';
import { TranslationEntry } from './translation-dict';

export class ContextTrieNode {
  children: Record<string, ContextTrieNode> = {};

  constructor(
    public ctx?: TranslationContext,
    public entry?: TranslationEntry,
  ) {}

  get hasData() {
    return this.ctx && this.entry;
  }

  setCtx(entry: TranslationEntry, ctx: TranslationContext): void {
    this.entry = entry;
    this.ctx = ctx;
  }

  *walk(): IterableIterator<[TranslationEntry, TranslationContext]> {
    if (this.ctx) {
      yield [this.entry, this.ctx];
    }
    for (const child of Object.values(this.children)) {
      yield* child.walk();
    }
  }
}

export class ContextTrie {
  protected root_ = new ContextTrieNode();

  constructor() {
    for (const str of Object.values(CTX.STR)) {
      this.root_.children[str] = new ContextTrieNode();
    }
  }

  addCtx(entry: TranslationEntry, ctx: TranslationContext) {
    let node = this.root_.children[ctx.type];
    if (!node) {
      throw new Error(`Invalid context type: ${ctx.type}`);
    }
    for (const part of ctx.paths) {
      if (!node.children[part.index]) {
        node.children[part.index] = new ContextTrieNode();
      }
      node = node.children[part.index];
    }
    node.setCtx(entry, ctx);
  }

  getNode(ctx: TranslationContext): ContextTrieNode {
    let node = this.root_.children[ctx.type];
    if (!node) {
      throw new Error(`Invalid context type: ${ctx.type}`);
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
