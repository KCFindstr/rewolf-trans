import * as iconv from 'iconv-lite';
import { ISerializable } from '../interfaces';
import { TranslationString } from '../translation/translation-string';
import { GlobalOptions } from '../operation/options';

export type AppendValueFn = (stream: BufferStream, value: number) => void;
const DefaultAppendValueFn = (stream: BufferStream, value: number) =>
  stream.appendIntLE(value);

export class BufferStream {
  private data_: number[] = [];

  get buffer() {
    return Buffer.from(this.data_);
  }

  appendBytes(buffer: Buffer) {
    for (let i = 0; i < buffer.length; i++) {
      this.data_.push(buffer[i]);
    }
  }

  appendByte(byte: number) {
    this.data_.push(byte & 0xff);
  }

  appendShortLE(num: number) {
    for (let i = 0; i < 2; i++) {
      this.data_.push(num & 0xff);
      num >>= 8;
    }
  }

  appendIntLE(num: number) {
    for (let i = 0; i < 4; i++) {
      this.data_.push(num & 0xff);
      num >>= 8;
    }
  }

  appendString(str: string, encoding = GlobalOptions.readEncoding) {
    const buffer = iconv.encode(str, encoding);
    this.appendIntLE(buffer.length + 1);
    this.appendBytes(buffer);
    this.appendByte(0);
  }

  appendTString(str: TranslationString) {
    this.appendString(
      str.text,
      str.isTranslated
        ? GlobalOptions.writeEncoding
        : GlobalOptions.readEncoding,
    );
  }

  appendStringArray(strs: string[], appendCountFn = DefaultAppendValueFn) {
    this.appendCustomArray(
      strs,
      (stream, str) => stream.appendString(str),
      appendCountFn,
    );
  }

  appendTStringArray(
    strs: TranslationString[],
    appendCountFn = DefaultAppendValueFn,
  ) {
    this.appendCustomArray(
      strs,
      (stream, str) => stream.appendTString(str),
      appendCountFn,
    );
  }

  appendByteArray(bytes: number[], appendCountFn = DefaultAppendValueFn) {
    this.appendCustomArray(
      bytes,
      (stream, byte) => stream.appendByte(byte),
      appendCountFn,
    );
  }

  appendIntArrayLE(ints: number[], appendCountFn = DefaultAppendValueFn) {
    this.appendCustomArray(
      ints,
      (stream, num) => stream.appendIntLE(num),
      appendCountFn,
    );
  }

  appendSerializableArray(
    serializable: ISerializable[],
    appendCountFn = DefaultAppendValueFn,
  ) {
    this.appendCustomArray(
      serializable,
      (stream, item) => item.serialize(stream),
      appendCountFn,
    );
  }

  appendCustomArray<T>(
    arr: T[],
    itemOp: (stream: BufferStream, item: T, index: number) => void,
    appendCountFn = DefaultAppendValueFn,
  ) {
    appendCountFn(this, arr.length);
    for (let i = 0; i < arr.length; i++) {
      itemOp(this, arr[i], i);
    }
  }
}
