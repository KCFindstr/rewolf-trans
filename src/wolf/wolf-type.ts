import { BufferStream } from '../archive/buffer-stream';
import { CONTEXT_SUFFIX, WOLF_DAT } from '../constants';
import { FileCoder } from '../archive/file-coder';
import { IAppendContext, IProjectData } from '../interfaces';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';
import { noop } from '../util';
import { TranslationString } from '../translation/translation-string';
import { EntryDangerLevel } from '../translation/translation-entry';

export class WolfType implements IProjectData, IAppendContext {
  name: TranslationString;
  fields: WolfField[];
  fieldTypeCount: number;
  data: WolfData[];
  description: string;
  unknown1: number;

  constructor(file: FileCoder) {
    this.name = file.readTString();
    // Field
    this.fields = file.readArray((f) => new WolfField(f));

    // Data
    this.data = file.readArray((f) => new WolfData(f));
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
      .readArray((f) => f.readTStringArray())
      .map((val, index) => {
        this.fields[index].stringArgs = val;
      });

    // Args
    file
      .readArray((f) => f.readUIntArray())
      .map((val, index) => {
        this.fields[index].args = val;
      });

    // Default value
    file.readUIntArray().map((val, index) => {
      this.fields[index].defaultValue = val;
    });
  }

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    ctxBuilder.enter(CONTEXT_SUFFIX);
    dict.add(
      this.name.text,
      EntryDangerLevel.Context,
      ctxBuilder.patchFile,
      ctxBuilder.build(this.name),
    );
    ctxBuilder.leave(CONTEXT_SUFFIX);

    for (let i = 0; i < this.data.length; i++) {
      const datum = this.data[i];
      ctxBuilder.enter(i, datum.name.text);
      datum.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
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
    stream.appendCustomArray(this.fields, (s, field) => field.serializeData(s));
    stream.appendCustomArray(this.data, (s, data) => data.serializeData(s));
  }

  serializeProject(stream: BufferStream): void {
    stream.appendTString(this.name);
    stream.appendCustomArray(this.fields, (s, field) =>
      field.serializeProject(s),
    );
    stream.appendCustomArray(this.data, (s, data) => data.serializeProject(s));
    stream.appendString(this.description);

    // Misc field data
    stream.appendInt(this.fieldTypeCount);
    this.fields.forEach((field) => stream.appendByte(field.type));
    for (let i = this.fields.length; i < this.fieldTypeCount; i++) {
      stream.appendByte(0);
    }
    stream.appendStringArray(this.fields.map((field) => field.unknown1));

    stream.appendCustomArray(this.fields, (s, field) => {
      s.appendTStringArray(field.stringArgs);
    });

    stream.appendCustomArray(this.fields, (s, field) => {
      s.appendIntArray(field.args);
    });

    stream.appendIntArray(this.fields.map((field) => field.defaultValue));
  }
}

export class WolfField implements IProjectData, IAppendContext {
  name: TranslationString;
  type: number;
  unknown1: string;
  stringArgs: TranslationString[];
  args: number[];
  defaultValue: number;
  indexInfo: number;

  constructor(file: FileCoder) {
    this.name = file.readTString();
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
    stream.appendTString(this.name);
  }

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    dict.addTexts(ctxBuilder, EntryDangerLevel.Warn, this.stringArgs);
  }
}

export type WolfDataKey = WolfField | number;
export type WolfDataValue = TranslationString | number;

export class WolfData implements IProjectData, IAppendContext {
  name: TranslationString;
  intValues: number[];
  stringValues: TranslationString[];
  fields: WolfField[];

  constructor(file: FileCoder) {
    this.name = file.readTString();
  }

  readData(file: FileCoder, fields: WolfField[]): void {
    this.fields = fields;
    const intValueSize = fields.filter((field) => field.isInt).length;
    const strValueSize = fields.filter((field) => field.isString).length;
    this.intValues = file.readUIntArray(() => intValueSize);
    this.stringValues = file.readTStringArray(() => strValueSize);
  }

  serializeData(stream: BufferStream): void {
    stream.appendIntArray(this.intValues, noop);
    stream.appendTStringArray(this.stringValues, noop);
  }

  serializeProject(stream: BufferStream): void {
    stream.appendTString(this.name);
  }

  getV(key: WolfDataKey): WolfDataValue {
    if (key instanceof WolfField) {
      if (key.isString) {
        return this.stringValues[key.index];
      } else {
        return this.intValues[key.index];
      }
    } else if (typeof key === 'number') {
      return this.getV(this.fields[key]);
    } else {
      throw new Error(`WolfType: Invalid key: ${key}`);
    }
  }

  setV(key: WolfDataKey, value: string | number, translate = false): void {
    if (key instanceof WolfField) {
      if (key.isString) {
        if (translate) {
          this.stringValues[key.index].patch(value as string);
        } else {
          this.stringValues[key.index].text = value as string;
        }
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
    ctxBuilder.enter(CONTEXT_SUFFIX);
    dict.add(
      this.name.text,
      EntryDangerLevel.Context,
      ctxBuilder.patchFile,
      ctxBuilder.build(this.name),
    );
    ctxBuilder.leave(CONTEXT_SUFFIX);

    this.fields
      .filter((field) => field.isTranslatable)
      .forEach((field) => {
        const value = this.getV(field);
        if (!(value instanceof TranslationString)) {
          throw new Error(`WolfType: Invalid value to translate: ${value}`);
        }
        ctxBuilder.enter(field.index, field.name.text);

        ctxBuilder.enter(CONTEXT_SUFFIX);
        dict.add(
          field.name.text,
          EntryDangerLevel.Context,
          ctxBuilder.patchFile,
          ctxBuilder.build(field.name),
        );
        ctxBuilder.leave(CONTEXT_SUFFIX);

        dict.add(
          value.text,
          EntryDangerLevel.Normal,
          ctxBuilder.patchFile,
          ctxBuilder.build(value),
        );
        field.appendContext(ctxBuilder, dict);
        ctxBuilder.leave(field.index);
      });
  }
}
