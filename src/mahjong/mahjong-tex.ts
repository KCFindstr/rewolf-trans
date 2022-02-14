import { FileCoder } from '../archive/file-coder';
import { logger } from '../logger';
import { MC_TEX_HEADER } from './constants';

export class MahjongFrameInfo {
  frameDataOffset: number;
  frameDataSize: number;
  reserved1: number[];
  data: Buffer;

  constructor(file: FileCoder) {
    this.frameDataOffset = file.readUIntLE();
    this.frameDataSize = file.readUIntLE();
    logger.debug(
      ` > offset: ${this.frameDataOffset.toString(
        16,
      )}, size: ${this.frameDataSize.toString(16)}`,
    );
    this.reserved1 = file.readUIntLEArray(() => 2);
    this.data = file.buffer.slice(
      this.frameDataOffset,
      this.frameDataOffset + this.frameDataSize,
    );
  }
}

export class MahjongTexHeader {
  protected numFrames_: number;
  protected frameInfoOffset_: number;
  protected frameDataOffset_: number;
  protected fileSize_: number;
  protected frames_: MahjongFrameInfo[];

  constructor(file: FileCoder) {
    file.expect(MC_TEX_HEADER);
    this.numFrames_ = file.readUIntLE();
    this.frameInfoOffset_ = file.readUIntLE();
    this.frameDataOffset_ = file.readUIntLE();
    this.fileSize_ = file.readUIntLE();
    logger.debug(
      `frames: ${
        this.numFrames_
      }, info offset: ${this.frameInfoOffset_.toString(
        16,
      )}, data offset: ${this.frameDataOffset_.toString(
        16,
      )}, file size: ${this.fileSize_.toString(16)}`,
    );
    file.pushPtr(this.frameInfoOffset_);
    this.frames_ = file.readArray(
      (f) => new MahjongFrameInfo(f),
      () => this.numFrames_,
    );
    file.popPtr();
  }
}
