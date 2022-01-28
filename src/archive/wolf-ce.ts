import * as path from 'path';
import { BufferStream } from '../buffer-stream';
import { CTX, WOLF_CE } from '../constants';
import { ISerializable } from '../interfaces';
import { ContextBuilder } from '../translation/context-builder';
import { escapePath } from '../translation/string-utils';
import { TranslationDict } from '../translation/translation-dict';
import { addLeadingChar } from '../util';
import { WolfArchive } from './wolf-archive';
import { WolfCommonEvent } from './wolf-common-event';
import { WolfContext } from './wolf-context';

export class WolfCE extends WolfArchive implements ISerializable {
  events_: WolfCommonEvent[];

  serialize(stream: BufferStream): void {
    stream.appendBuffer(WOLF_CE.HEADER);
    stream.appendSerializableArray(this.events_);
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

  override generatePatch(dict: TranslationDict): void {
    const pathInfo = path.parse(this.file_.filename);
    const patchPath = path.join(pathInfo.dir, pathInfo.name);
    const relativeFile = WolfContext.pathResolver.relativePath(patchPath);
    const ctxBuilder = new ContextBuilder(relativeFile, CTX.STR.CE);
    for (const event of this.events_) {
      ctxBuilder.patchFile = path.join(
        relativeFile,
        `${addLeadingChar(event.id, 3, '0')}_${escapePath(event.name)}.txt`,
      );
      ctxBuilder.enter(event.id);
      event.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(event.id);
    }
  }
}
