import { BufferStream } from '../buffer-stream';
import { WOLF_CE } from '../constants';
import { FileCoder } from './file-coder';
import { ISerializable } from './interfaces';
import { createCommand, WolfCommand } from './wolf-command';

export class WolfCommonEvent implements ISerializable {
  id: number;
  name: string;
  commands: WolfCommand[];
  description: string;
  unknown1: number;
  unknown2: Buffer;
  unknown3: string[];
  unknown4: number[];
  unknown5: string[][];
  unknown6: number[][];
  unknown7: Buffer;
  unknown8: string[];
  unknown9: string;
  unknown10: string;
  unknown11: string;
  unknown12: number;

  constructor(file: FileCoder) {
    file.expectByte(WOLF_CE.INDICATOR1);
    this.id = file.readUIntLE();
    this.unknown1 = file.readUIntLE();
    this.unknown2 = file.readBytes(7);
    this.name = file.readString();
    const commandCount = file.readUIntLE();
    this.commands = [];
    for (let i = 0; i < commandCount; i++) {
      this.commands.push(createCommand(file));
    }
    this.unknown11 = file.readString();
    this.description = file.readString();
    file.expectByte(WOLF_CE.INDICATOR2);
    file.expect(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown3 = [];
    for (let i = 0; i < 10; i++) {
      this.unknown3.push(file.readString());
    }
    file.expect(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown4 = [];
    for (let i = 0; i < 10; i++) {
      this.unknown4.push(file.readByte());
    }
    file.expect(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown5 = [];
    for (let i = 0; i < 10; i++) {
      const arr: string[] = [];
      const count = file.readUIntLE();
      for (let j = 0; j < count; j++) {
        arr.push(file.readString());
      }
      this.unknown5.push(arr);
    }
    file.expect(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown6 = [];
    for (let i = 0; i < 10; i++) {
      const arr: number[] = [];
      const count = file.readUIntLE();
      for (let j = 0; j < count; j++) {
        arr.push(file.readUIntLE());
      }
      this.unknown6.push(arr);
    }
    this.unknown7 = file.readBytes(0x1d);
    this.unknown8 = [];
    for (let i = 0; i < 100; i++) {
      this.unknown8.push(file.readString());
    }
    file.expectByte(WOLF_CE.INDICATOR3);
    this.unknown9 = file.readString();
    const indicator = file.readByte();
    if (indicator === WOLF_CE.INDICATOR3) {
      return;
    }
    file.assert(
      indicator === WOLF_CE.INDICATOR4,
      `Expected ${WOLF_CE.INDICATOR4}, got ${indicator}`,
    );
    this.unknown10 = file.readString();
    this.unknown12 = file.readUIntLE();
    file.expectByte(WOLF_CE.INDICATOR4);
  }
  serialize(stream: BufferStream): void {
    stream.appendByte(WOLF_CE.INDICATOR1);
    stream.appendInt(this.id);
    stream.appendInt(this.unknown1);
    stream.appendBuffer(this.unknown2);
    stream.appendString(this.name);
    stream.appendInt(this.commands.length);
    this.commands.forEach((command) => command.serialize(stream));
    stream.appendString(this.unknown11);
    stream.appendString(this.description);
    stream.appendByte(WOLF_CE.INDICATOR2);
    stream.appendBuffer(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown3.forEach((str) => stream.appendString(str));
    stream.appendBuffer(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown4.forEach((num) => stream.appendByte(num));
    stream.appendBuffer(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown5.forEach((arr) => {
      stream.appendInt(arr.length);
      arr.forEach((str) => stream.appendString(str));
    });
    stream.appendBuffer(WOLF_CE.EVENT_MAGIC_NUMBER);
    this.unknown6.forEach((arr) => {
      stream.appendInt(arr.length);
      arr.forEach((num) => stream.appendInt(num));
    });
    stream.appendBuffer(this.unknown7);
    this.unknown8.forEach((str) => stream.appendString(str));
    stream.appendByte(WOLF_CE.INDICATOR3);
    stream.appendString(this.unknown9);
    if (this.unknown10) {
      stream.appendByte(WOLF_CE.INDICATOR4);
      stream.appendString(this.unknown10);
      stream.appendInt(this.unknown12);
      stream.appendByte(WOLF_CE.INDICATOR4);
    } else {
      stream.appendByte(WOLF_CE.INDICATOR3);
    }
  }
}
