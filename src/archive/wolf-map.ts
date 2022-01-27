import * as fs from 'fs';
import * as path from 'path';
import { BufferStream } from '../buffer-stream';
import { WOLF_EN_HEADER, WOLF_JP_HEADER, WOLF_MAP } from '../constants';
import { bufferStartsWith, ensureDir } from '../util';
import { ISerializable } from '../interfaces';
import { WolfArchive } from './wolf-archive';
import { WolfEvent } from './wolf-events';
import { TranslationDict } from '../translation/translation-dict';

export enum WolfArchiveType {
  Invalid,
  Jp,
  En,
}

export class WolfMap extends WolfArchive implements ISerializable {
  protected mapType_ = WolfArchiveType.Invalid;
  protected tilesetId_ = -1;
  protected width_ = -1;
  protected height_ = -1;
  protected tiles_: Buffer;
  protected events_: WolfEvent[];

  constructor(filename: string) {
    super(filename);
    if (!super.isValid) {
      return;
    }
    if (bufferStartsWith(this.file_.buffer, WOLF_JP_HEADER)) {
      this.mapType_ = WolfArchiveType.Jp;
    } else if (bufferStartsWith(this.file_.buffer, WOLF_EN_HEADER)) {
      this.mapType_ = WolfArchiveType.En;
    } else {
      this.mapType_ = WolfArchiveType.Invalid;
    }
  }

  override get isValid() {
    return this.mapType_ !== WolfArchiveType.Invalid;
  }

  override parse() {
    this.file_.assert(this.isValid, 'Invalid map file.');
    if (this.mapType_ === WolfArchiveType.Jp) {
      this.file_.expect(WOLF_JP_HEADER);
    } else if (this.mapType_ === WolfArchiveType.En) {
      this.file_.expect(WOLF_EN_HEADER);
    }
    this.tilesetId_ = this.file_.readUIntLE();
    this.width_ = this.file_.readUIntLE();
    this.height_ = this.file_.readUIntLE();
    const eventCount = this.file_.readUIntLE();
    this.tiles_ = this.file_.readBytes(this.width_ * this.height_ * 3 * 4);
    this.events_ = [];
    let indicator: number;
    while ((indicator = this.file_.readByte()) === WOLF_MAP.EVENT_INDICATOR) {
      this.events_.push(new WolfEvent(this.file_));
    }
    this.file_.assert(
      indicator === WOLF_MAP.EVENT_FINISH_INDICATOR,
      `Unexpected event indicator ${indicator}`,
    );
    this.file_.assert(this.file_.isEof, `File not fully parsed`);
    this.file_.assert(
      this.events_.length === eventCount,
      `Expected ${eventCount} events, got ${this.events_.length}`,
    );
  }

  serialize(stream: BufferStream) {
    this.file_.assert(this.isValid, 'Invalid map file.');
    if (this.mapType_ === WolfArchiveType.Jp) {
      stream.appendBuffer(WOLF_JP_HEADER);
    } else if (this.mapType_ === WolfArchiveType.En) {
      stream.appendBuffer(WOLF_EN_HEADER);
    }
    stream.appendInt(this.tilesetId_);
    stream.appendInt(this.width_);
    stream.appendInt(this.height_);
    stream.appendInt(this.events_.length);
    stream.appendBuffer(this.tiles_);
    for (const event of this.events_) {
      stream.appendByte(WOLF_MAP.EVENT_INDICATOR);
      event.serialize(stream);
    }
    stream.appendByte(WOLF_MAP.EVENT_FINISH_INDICATOR);
  }

  write(filepath: string) {
    const stream = new BufferStream();
    this.serialize(stream);
    ensureDir(path.dirname(filepath));
    fs.writeFileSync(filepath, stream.buffer);
  }

  override generatePatch(_dict: TranslationDict): void {
    throw new Error('Method not implemented.');
  }
}
