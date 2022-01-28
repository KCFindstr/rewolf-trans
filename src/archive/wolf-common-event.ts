import { BufferStream } from '../buffer-stream';
import { WOLF_CE } from '../constants';
import { FileCoder } from './file-coder';
import { IContextSupplier, ISerializable } from '../interfaces';
import { createCommand, WolfCommand } from './wolf-command';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';

export class WolfCommonEvent implements ISerializable, IContextSupplier {
  id: number;
  name: string;
  commands: WolfCommand[];
  description: string;
  unknown1: number;
  unknown2: Buffer;
  strArgs: string[];
  byteArgs: number[];
  spOptionArgs: string[][];
  spOptionValArgs: number[][];
  intArgs: number[];
  unknown3: Buffer;
  cSelf: string[];
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
    this.commands = file.readArray((file) => createCommand(file));
    this.unknown6 = file.readString();
    this.description = file.readString();
    file.expectByte(WOLF_CE.INDICATOR2);
    this.strArgs = file.readStringArray();
    this.byteArgs = file.readByteArray();
    this.spOptionArgs = file.readArray((file) => file.readStringArray());
    this.spOptionValArgs = file.readArray((file) => file.readUIntArray());
    this.intArgs = file.readUIntArray();
    this.unknown3 = file.readBytes(5);
    this.cSelf = [];
    for (let i = 0; i < 100; i++) {
      this.cSelf.push(file.readString());
    }
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
    stream.appendStringArray(this.strArgs);
    stream.appendByteArray(this.byteArgs);
    stream.appendCustomArray(this.spOptionArgs, (stream, arr) => {
      stream.appendStringArray(arr);
    });
    stream.appendCustomArray(this.spOptionValArgs, (stream, arr) => {
      stream.appendIntArray(arr);
    });
    stream.appendIntArray(this.intArgs);
    stream.appendBuffer(this.unknown3);
    this.cSelf.forEach((str) => stream.appendString(str));
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
    for (let i = 0; i < this.commands.length; i++) {
      ctxBuilder.enter(i + 1);
      this.commands[i].appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i + 1);
    }
  }
}
