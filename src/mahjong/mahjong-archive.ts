import * as path from 'path';
import { RewtArchive } from '../archive/rewt-archive';
import { PathResolver } from '../operation/path-resolver';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';
import { bufferStartsWith } from '../util';
import { MC_DAT_HEADER, MC_PATCH_TYPE } from './constants';
import { MahjongDatEntry } from './mahjong-dat-entry';

export class MahjongArchive extends RewtArchive {
  protected isValid_ = false;
  protected numEntries_: number;
  protected reserved1_: number;
  protected entryOffset_: number;
  protected dataOffset_: number;
  protected reserved2_: Buffer;
  protected entries_: MahjongDatEntry[] = [];

  constructor(filename: string) {
    super(filename);
    if (super.isValid && bufferStartsWith(this.buffer, MC_DAT_HEADER)) {
      this.isValid_ = true;
    }
  }

  override get isValid() {
    return super.isValid && this.isValid_;
  }

  parse(): void {
    if (!this.isValid) {
      return;
    }
    this.file_.expect(MC_DAT_HEADER);
    this.numEntries_ = this.file_.readUIntLE();
    this.reserved1_ = this.file_.readUIntLE();
    this.entryOffset_ = this.file_.readUIntLE();
    this.dataOffset_ = this.file_.readUIntLE();
    this.reserved2_ = this.file_.readBytes(32);

    // Read entries
    this.file_.pushPtr(this.entryOffset_);
    for (let i = 0; i < this.numEntries_; i++) {
      const entry = new MahjongDatEntry(this.file_);
      this.entries_.push(entry);
    }
    this.file_.popPtr();
  }

  write(_pathResolver: PathResolver): void {
    throw new Error('Method not implemented.');
  }

  generatePatch(pathResolver: PathResolver, dict: TranslationDict): void {
    const pathInfo = path.parse(this.file_.filename);
    const patchPath = path.join(pathInfo.dir, pathInfo.name);
    const relativeFile = pathResolver.relativePath(patchPath);
    const ctxBuilder = new ContextBuilder(MC_PATCH_TYPE.SCENE);
    ctxBuilder.enterPatch(relativeFile);
    this.entries_.forEach((entry, i) => {
      ctxBuilder.enterPatch(entry.name);
      ctxBuilder.enter(i, entry.name);
      entry.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
      ctxBuilder.leavePatch(entry.name);
    });
    ctxBuilder.leavePatch(relativeFile);
  }
}
