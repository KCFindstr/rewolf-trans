import { BufferStream } from '../archive/buffer-stream';
import { WOLF_CE } from './constants';
import { FileCoder } from '../archive/file-coder';
import { IAppendContext, ISerializable } from '../interfaces';
import { createCommand, WolfCommand } from './wolf-command';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';
import { TranslationString } from '../translation/translation-string';
import { noop } from '../util';
import { PatchFileCategory } from '../translation/translation-entry';

export class WolfCommonEvent implements ISerializable, IAppendContext {
  id: number;
  name: string;
  commands: WolfCommand[];
  description: string;
  unknown1: number;
  unknown2: Buffer;
  strArgs: TranslationString[];
  byteArgs: number[];
  spOptionArgs: TranslationString[][];
  spOptionValArgs: number[][];
  intArgs: number[];
  unknown3: Buffer;
  cSelf: TranslationString[];
  unknown4: string;
  unknown5: string;
  unknown6: string;
  unknown7: number;

  constructor(file: FileCoder) {
    file.expectByte(WOLF_CE.INDICATOR1);
    this.id = file.readUIntLE();
    this.unknown1 = file.readUIntLE();
    this.unknown2 = file.readBytes(7);
    this.name = file.readString();
    this.commands = file.readArray((f) => createCommand(f));
    this.unknown6 = file.readString();
    this.description = file.readString();
    file.expectByte(WOLF_CE.INDICATOR2);
    this.strArgs = file.readTStringArray();
    this.byteArgs = file.readByteArray();
    this.spOptionArgs = file.readArray((f) => f.readTStringArray());
    this.spOptionValArgs = file.readArray((f) => f.readUIntArray());
    this.intArgs = file.readUIntArray();
    this.unknown3 = file.readBytes(5);
    this.cSelf = file.readTStringArray(() => 100);
    file.expectByte(WOLF_CE.INDICATOR3);
    this.unknown4 = file.readString();
    const indicator = file.readByte();
    if (indicator === WOLF_CE.INDICATOR3) {
      return;
    }
    file.assert(
      indicator === WOLF_CE.INDICATOR4,
      `Expected ${WOLF_CE.INDICATOR4}, got ${indicator}`,
    );
    this.unknown5 = file.readString();
    this.unknown7 = file.readUIntLE();
    file.expectByte(WOLF_CE.INDICATOR4);
  }

  serialize(stream: BufferStream): void {
    stream.appendByte(WOLF_CE.INDICATOR1);
    stream.appendInt(this.id);
    stream.appendInt(this.unknown1);
    stream.appendBuffer(this.unknown2);
    stream.appendString(this.name);
    stream.appendSerializableArray(this.commands);
    stream.appendString(this.unknown6);
    stream.appendString(this.description);
    stream.appendByte(WOLF_CE.INDICATOR2);
    stream.appendTStringArray(this.strArgs);
    stream.appendByteArray(this.byteArgs);
    stream.appendCustomArray(this.spOptionArgs, (s, arr) => {
      s.appendTStringArray(arr);
    });
    stream.appendCustomArray(this.spOptionValArgs, (s, arr) => {
      s.appendIntArray(arr);
    });
    stream.appendIntArray(this.intArgs);
    stream.appendBuffer(this.unknown3);
    stream.appendTStringArray(this.cSelf, noop);
    stream.appendByte(WOLF_CE.INDICATOR3);
    stream.appendString(this.unknown4);
    if (this.unknown5) {
      stream.appendByte(WOLF_CE.INDICATOR4);
      stream.appendString(this.unknown5);
      stream.appendInt(this.unknown7);
      stream.appendByte(WOLF_CE.INDICATOR4);
    } else {
      stream.appendByte(WOLF_CE.INDICATOR3);
    }
  }

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    ctxBuilder.enter('cmd');
    for (let i = 0; i < this.commands.length; i++) {
      ctxBuilder.enter(i);
      this.commands[i].appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
    }
    ctxBuilder.leave('cmd');

    ctxBuilder.enter('strarg');
    dict.addTexts(ctxBuilder, PatchFileCategory.Danger, this.strArgs);
    ctxBuilder.leave('strarg');

    ctxBuilder.enter('optarg');
    for (let i = 0; i < this.spOptionArgs.length; i++) {
      ctxBuilder.enter(i);
      dict.addTexts(ctxBuilder, PatchFileCategory.Danger, this.spOptionArgs[i]);
      ctxBuilder.leave(i);
    }
    ctxBuilder.leave('optarg');

    ctxBuilder.enter('cself');
    dict.addTexts(ctxBuilder, PatchFileCategory.Danger, this.cSelf);
    ctxBuilder.leave('cself');
  }
}
