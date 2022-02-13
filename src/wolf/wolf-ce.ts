import * as path from 'path';
import { BufferStream } from '../archive/buffer-stream';
import { CTX, WOLF_CE } from './constants';
import { ISerializable } from '../interfaces';
import { ContextBuilder } from '../translation/context-builder';
import { escapePath } from '../translation/string-utils';
import { TranslationDict } from '../translation/translation-dict';
import { addLeadingChar, bufferStartsWith, forceWriteFile } from '../util';
import { PathResolver } from '../operation/path-resolver';
import { RewtArchive } from '../archive/rewt-archive';
import { WolfCommonEvent } from './wolf-common-event';
import { WolfContext } from '../operation/wolf-context';

export class WolfCE extends RewtArchive implements ISerializable {
  events_: WolfCommonEvent[];
  isValid_ = false;

  constructor(filename: string) {
    super(filename);
    if (!super.isValid) {
      return;
    }
    if (!bufferStartsWith(this.file_.buffer, WOLF_CE.HEADER)) {
      return;
    }
    this.isValid_ = true;
  }

  override get isValid() {
    return this.isValid_;
  }

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

  write(pathResolver: PathResolver): void {
    const stream = new BufferStream();
    this.serialize(stream);
    forceWriteFile(pathResolver.translatePath(this.filename), stream.buffer);
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
        `${addLeadingChar(event.id, 3, '0')}_${escapePath(event.name)}`,
      );
      ctxBuilder.enter(event.id);
      event.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(event.id);
    }
  }
}
