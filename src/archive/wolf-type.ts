import { BufferStream } from '../buffer-stream';
import { WOLF_DAT } from '../constants';
import { FileCoder } from './file-coder';
import { IProjectData } from './interfaces';

export class WolfType implements IProjectData {
  name: string;
  fields: WolfField[];
  fieldTypeCount: number;
  data: WolfData[];
  description: string;
  unknown1: number;

  constructor(file: FileCoder) {
    this.name = file.readString();
    // Field
    const fieldCount = file.readUIntLE();
    this.fields = [];
    for (let i = 0; i < fieldCount; i++) {
      this.fields.push(new WolfField(file));
    }

    // Data
    const dataCount = file.readUIntLE();
    this.data = [];
    for (let i = 0; i < dataCount; i++) {
      this.data.push(new WolfData(file));
    }
    this.description = file.readString();

    // Field Type
    this.fieldTypeCount = file.readUIntLE();
    for (let i = 0; i < this.fields.length; i++) {
      this.fields[i].type = file.readByte();
    }
    file.skip(this.fieldTypeCount - this.fields.length);

    // Unknown
    const unknown1Count = file.readUIntLE();
    for (let i = 0; i < unknown1Count; i++) {
      this.fields[i].unknown1 = file.readString();
    }

    // String args
    const strArgsCount = file.readUIntLE();
    for (let i = 0; i < strArgsCount; i++) {
      this.fields[i].stringArgs = [];
      const fieldStrArgsCount = file.readUIntLE();
      for (let j = 0; j < fieldStrArgsCount; j++) {
        this.fields[i].stringArgs.push(file.readString());
      }
    }

    // Args
    const argsCount = file.readUIntLE();
    for (let i = 0; i < argsCount; i++) {
      this.fields[i].args = [];
      const fieldArgsCount = file.readUIntLE();
      for (let j = 0; j < fieldArgsCount; j++) {
        this.fields[i].args.push(file.readUIntLE());
      }
    }

    // Default value
    const defaultValueCount = file.readUIntLE();
    for (let i = 0; i < defaultValueCount; i++) {
      this.fields[i].defaultValue = file.readUIntLE();
    }
  }

  readData(file: FileCoder): void {
    file.expect(WOLF_DAT.TYPE_SEPARATOR);
    this.unknown1 = file.readUIntLE();
    const fieldCount = file.readUIntLE();
    this.fields.splice(fieldCount);
    this.fields.forEach((field) => field.readData(file));
    const dataSize = file.readUIntLE();
    this.data.splice(dataSize);
    this.data.forEach((data) => data.readData(file, this.fields));
  }

  serializeData(stream: BufferStream): void {
    stream.appendBuffer(WOLF_DAT.TYPE_SEPARATOR);
    stream.appendInt(this.unknown1);
    stream.appendInt(this.fields.length);
    this.fields.forEach((field) => field.serializeData(stream));
    stream.appendInt(this.data.length);
    this.data.forEach((data) => data.serializeData(stream));
  }

  serializeProject(stream: BufferStream): void {
    stream.appendString(this.name);
    stream.appendInt(this.fields.length);
    this.fields.forEach((field) => field.serializeProject(stream));
    stream.appendInt(this.data.length);
    this.data.forEach((data) => data.serializeProject(stream));
    stream.appendString(this.description);

    // Misc field data
    stream.appendInt(this.fieldTypeCount);
    this.fields.forEach((field) => stream.appendByte(field.type));
    for (let i = this.fields.length; i < this.fieldTypeCount; i++) {
      stream.appendByte(0);
    }
    stream.appendInt(this.fields.length);
    this.fields.forEach((field) => stream.appendString(field.unknown1));
    stream.appendInt(this.fields.length);
    this.fields.forEach((field) => {
      stream.appendInt(field.stringArgs.length);
      field.stringArgs.forEach((str) => stream.appendString(str));
    });
    stream.appendInt(this.fields.length);
    this.fields.forEach((field) => {
      stream.appendInt(field.args.length);
      field.args.forEach((arg) => stream.appendInt(arg));
    });
    stream.appendInt(this.fields.length);
    this.fields.forEach((field) => stream.appendInt(field.defaultValue));
  }
}

export class WolfField implements IProjectData {
  name: string;
  type: number;
  unknown1: string;
  stringArgs: string[];
  args: number[];
  defaultValue: number;
  indexInfo: number;

  constructor(file: FileCoder) {
    this.name = file.readString();
  }

  get isString() {
    return this.indexInfo >= WOLF_DAT.STRING_START;
  }

  get isInt() {
    return !this.isString;
  }

  get index() {
    if (this.isString) {
      return this.indexInfo - WOLF_DAT.STRING_START;
    } else {
      return this.indexInfo - WOLF_DAT.INT_START;
    }
  }

  readData(file: FileCoder): void {
    this.indexInfo = file.readUIntLE();
  }

  serializeData(stream: BufferStream): void {
    stream.appendInt(this.indexInfo);
  }

  serializeProject(stream: BufferStream): void {
    stream.appendString(this.name);
  }
}

export interface WolfDataStringValue {
  text: string;
  isTranslated: boolean;
}

export type WolfDataKey = WolfField | number;
export type WolfDataValue = string | number;

export class WolfData implements IProjectData {
  name: string;
  intValues: number[];
  stringValues: WolfDataStringValue[];
  fields: WolfField[];

  constructor(file: FileCoder) {
    this.name = file.readString();
  }

  readData(file: FileCoder, fields: WolfField[]): void {
    this.fields = fields;
    const intValueSize = fields.filter((field) => field.isInt).length;
    const strValueSize = fields.filter((field) => field.isString).length;
    this.intValues = [];
    this.stringValues = [];
    for (let i = 0; i < intValueSize; i++) {
      this.intValues.push(file.readUIntLE());
    }
    for (let i = 0; i < strValueSize; i++) {
      this.stringValues.push({
        text: file.readString(),
        isTranslated: false,
      });
    }
  }

  serializeData(stream: BufferStream): void {
    this.intValues.forEach((value) => stream.appendInt(value));
    this.stringValues.forEach((value) =>
      value.isTranslated
        ? stream.appendLocaleString(value.text)
        : stream.appendString(value.text),
    );
  }

  serializeProject(stream: BufferStream): void {
    stream.appendString(this.name);
  }

  getV(key: WolfDataKey): WolfDataValue {
    if (key instanceof WolfField) {
      if (key.isString) {
        return this.stringValues[key.index].text;
      } else {
        return this.intValues[key.index];
      }
    } else if (typeof key === 'number') {
      return this.getV(this.fields[key]);
    } else {
      throw new Error(`WolfType: Invalid key: ${key}`);
    }
  }

  setV(key: WolfDataKey, value: WolfDataValue): void {
    if (key instanceof WolfField) {
      if (key.isString) {
        this.stringValues[key.index].text = value as string;
      } else {
        this.intValues[key.index] = value as number;
      }
    } else if (typeof key === 'number') {
      this.setV(this.fields[key], value);
    } else {
      throw new Error(`WolfType: Invalid key: ${key}`);
    }
  }
}
