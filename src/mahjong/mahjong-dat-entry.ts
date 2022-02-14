import * as path from 'path';
import { FileCoder } from '../archive/file-coder';
import { logger } from '../logger';
import { bufferStartsWith } from '../util';
import { MC_MBT_HEADER, MC_TEX_HEADER } from './constants';
import { MahjongMBT } from './mahjong-mbt';
import { MahjongTex } from './mahjong-tex';

export class MahjongDatEntry {
  protected name_: string;
  protected unknown1_: number;
  protected unknown2_: number;
  protected flags_: number;
  protected offset_: number;
  protected size_: number;
  protected reserved1_: number[];

  // Possible data union
  protected tex_: MahjongTex;
  protected mbt_: MahjongMBT;

  // Auxiliary variables
  public data: Buffer;
  public subfile: FileCoder;
  public filename: string;

  get fullpath() {
    return path.join(this.filename, this.name_);
  }

  constructor(file: FileCoder) {
    this.filename = file.filename;
    this.name_ = file.readString(() => 40);
    this.unknown1_ = file.readByte();
    this.unknown2_ = file.readByte();
    this.flags_ = file.readUShortLE();
    this.offset_ = file.readUIntLE();
    this.size_ = file.readUIntLE();
    this.reserved1_ = file.readUIntLEArray(() => 3);
    logger.debug(
      `[${this.name_}] ${this.offset_.toString(16)} ${this.size_.toString(16)}`,
    );
    this.data = file.buffer.slice(this.offset_, this.offset_ + this.size_);
    this.subfile = new FileCoder(this.fullpath, undefined, this.data);
    if (bufferStartsWith(this.data, MC_TEX_HEADER)) {
      this.tex_ = new MahjongTex(this.subfile);
    } else if (bufferStartsWith(this.data, MC_MBT_HEADER)) {
      this.mbt_ = new MahjongMBT(this.subfile);
    }
  }
}
