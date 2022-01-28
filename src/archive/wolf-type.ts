import { BufferStream } from '../buffer-stream';
import { WOLF_DAT } from '../constants';
import { FileCoder } from './file-coder';
import { IContextSupplier, IProjectData } from '../interfaces';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';
import { DatabaseContext } from '../translation/database-context';
import { isTranslatable } from '../translation/string-utils';

export class WolfType implements IProjectData, IContextSupplier {
  name: string;
  fields: WolfField[];
  fieldTypeCount: number;
  data: WolfData[];
  description: string;
  unknown1: number;

  constructor(file: FileCoder) {
    this.name = file.readString();
    // Field
    this.fields = file.readArray((file) => new WolfField(file));

    // Data
    this.data = file.readArray((file) => new WolfData(file));
    this.description = file.readString();

    // Field Type
    const fieldTypes = file.readByteArray();
    this.fieldTypeCount = fieldTypes.length;
    for (let i = 0; i < this.fields.length; i++) {
      this.fields[i].type = fieldTypes[i];
    }

    // Unknown
    file.readStringArray().map((val, index) => {
      this.fields[index].unknown1 = val;
    });

    // String args
    file
      .readArray((file) => file.readStringArray())
      .map((val, index) => {
        this.fields[index].stringArgs = val;
      });

    // Args
    file
      .readArray((file) => file.readUIntArray())
      .map((val, index) => {
        this.fields[index].args = val;
      });

    // Default value
    file.readUIntArray().map((val, index) => {
      this.fields[index].defaultValue = val;
    });
  }
  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    ctxBuilder.enter(this);
    for (let i = 0; i < this.data.length; i++) {
      ctxBuilder.enter(i);
      this.data[i].appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
    }
    ctxBuilder.leave(this);
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
    stream.appendCustomArray(this.fields, (stream, field) =>
      field.serializeData(stream),
    );
    stream.appendCustomArray(this.data, (stream, data) =>
      data.serializeData(stream),
    );
  }

  serializeProject(stream: BufferStream): void {
    stream.appendString(this.name);
    stream.appendCustomArray(this.fields, (stream, field) =>
      field.serializeProject(stream),
    );
    stream.appendCustomArray(this.data, (stream, data) =>
      data.serializeProject(stream),
    );
    stream.appendString(this.description);

    // Misc field data
    stream.appendInt(this.fieldTypeCount);
    this.fields.forEach((field) => stream.appendByte(field.type));
    for (let i = this.fields.length; i < this.fieldTypeCount; i++) {
      stream.appendByte(0);
    }
    stream.appendStringArray(this.fields.map((field) => field.unknown1));

    stream.appendCustomArray(this.fields, (stream, field) => {
      stream.appendStringArray(field.stringArgs);
    });

    stream.appendCustomArray(this.fields, (stream, field) => {
      stream.appendIntArray(field.args);
    });

    stream.appendIntArray(this.fields.map((field) => field.defaultValue));
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

  get isTranslatable(): boolean {
    return this.isString && this.type === 0;
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

export class WolfData implements IProjectData, IContextSupplier {
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

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    ctxBuilder.enter(this);
    this.fields
      .filter((field) => field.isTranslatable)
      .forEach((field) => {
        const value = this.getV(field);
        if (typeof value !== 'string') {
          throw new Error(`WolfType: Invalid value to translate: ${value}`);
        }
        if (!isTranslatable(value)) {
          return;
        }
        ctxBuilder.enter(field);
        const ctx: DatabaseContext = DatabaseContext.FromData.apply(
          undefined,
          ctxBuilder.ctxArr,
        );
        ctx.withPatchCallback((_, translated) => {
          this.setV(field, translated);
        });
        dict.add(value, ctxBuilder.patchFile, ctx);
        ctxBuilder.leave(field);
      });
    ctxBuilder.leave(this);
  }
}
