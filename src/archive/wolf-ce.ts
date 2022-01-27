import { BufferStream } from '../buffer-stream';
import { WOLF_CE } from '../constants';
import { ISerializable } from '../interfaces';
import { TranslationDict } from '../translation/translation-dict';
import { WolfArchive } from './wolf-archive';
import { WolfCommonEvent } from './wolf-common-event';

export class WolfCE extends WolfArchive implements ISerializable {
  events_: WolfCommonEvent[];

  serialize(stream: BufferStream): void {
    stream.appendBuffer(WOLF_CE.HEADER);
    stream.appendInt(this.events_.length);
    this.events_.forEach((event) => event.serialize(stream));
    stream.appendByte(WOLF_CE.INDICATOR2);
  }

  parse(): void {
    this.file_.expect(WOLF_CE.HEADER);
    const eventCount = this.file_.readUIntLE();
    this.events_ = new Array(eventCount);
    for (let i = 0; i < eventCount; i++) {
      const event = new WolfCommonEvent(this.file_);
      this.events_[event.id] = event;
    }
    this.file_.expectByte(WOLF_CE.INDICATOR2);
  }

  get events() {
    return this.events_;
  }

  override generatePatch(
    _dataDir: string,
    _patchDir: string,
    _dict: TranslationDict,
  ): void {
    throw new Error('Method not implemented.');
  }
}
