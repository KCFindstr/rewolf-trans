import { BufferStream } from '../buffer-stream';
import { WOLF_EN_HEADER, WOLF_JP_HEADER, WOLF_MAP } from '../constants';
import { bufferStartsWith } from '../util';
import { WolfArchive } from './wolf-archive';
import { WolfEvent } from './wolf-events';

export enum WolfArchiveType {
  Invalid,
  Jp,
  En,
}

export class WolfMap extends WolfArchive {
  protected mapType_ = WolfArchiveType.Invalid;
  protected tilesetId_ = -1;
  protected width_ = -1;
  protected height_ = -1;
  protected tiles_: Buffer;
  protected eventCount_ = -1;
  protected events_: WolfEvent[];

  constructor(filename: string) {
    super(filename);
    if (!super.isValid) {
      return;
    }
    if (bufferStartsWith(this.file.buffer, WOLF_JP_HEADER)) {
      this.mapType_ = WolfArchiveType.Jp;
    } else if (bufferStartsWith(this.file.buffer, WOLF_EN_HEADER)) {
      this.mapType_ = WolfArchiveType.En;
    } else {
      this.mapType_ = WolfArchiveType.Invalid;
    }
  }

  override get isValid() {
    return this.mapType_ !== WolfArchiveType.Invalid;
  }

  override parse() {
    this.file.assert(this.isValid, 'Invalid map file.');
    if (this.mapType_ === WolfArchiveType.Jp) {
      this.file.expect(WOLF_JP_HEADER);
    } else if (this.mapType_ === WolfArchiveType.En) {
      this.file.expect(WOLF_EN_HEADER);
    }
    this.tilesetId_ = this.file.readUIntLE();
    this.width_ = this.file.readUIntLE();
    this.height_ = this.file.readUIntLE();
    this.eventCount_ = this.file.readUIntLE();
    this.tiles_ = this.file.readBytes(this.width_ * this.height_ * 3 * 4);
    this.events_ = [];
    let indicator: number;
    while ((indicator = this.file.readByte()) === WOLF_MAP.EVENT_INDICATOR) {
      this.events_.push(new WolfEvent(this.file));
    }
    this.file.assert(
      indicator === WOLF_MAP.EVENT_FINISH_INDICATOR,
      `Unexpected event indicator ${indicator}`,
    );
    this.file.assert(this.file.isEof, `File not fully parsed`);
    this.file.assert(
      this.events_.length === this.eventCount_,
      `Expected ${this.eventCount_} events, got ${this.events_.length}`,
    );
  }

  override serialize(stream: BufferStream) {
    this.file.assert(this.isValid, 'Invalid map file.');
    if (this.mapType_ === WolfArchiveType.Jp) {
      stream.appendBuffer(WOLF_JP_HEADER);
    } else if (this.mapType_ === WolfArchiveType.En) {
      stream.appendBuffer(WOLF_EN_HEADER);
    }
    stream.appendInt(this.tilesetId_);
    stream.appendInt(this.width_);
    stream.appendInt(this.height_);
    stream.appendInt(this.eventCount_);
    stream.appendBuffer(this.tiles_);
    for (const event of this.events_) {
      stream.appendByte(WOLF_MAP.EVENT_INDICATOR);
      event.serialize(stream);
    }
    stream.appendByte(WOLF_MAP.EVENT_FINISH_INDICATOR);
  }
}
