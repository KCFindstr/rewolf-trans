import * as iconv from 'iconv-lite';
import { WolfContext } from './archive/wolf-context';
import { ISerializable } from './interfaces';
import { TranslationString } from './translation/translation-string';

export type AppendValueFn = (stream: BufferStream, value: number) => void;
const DefaultAppendValueFn = (stream: BufferStream, value: number) =>
  stream.appendInt(value);

export class BufferStream {
  private data_: number[] = [];

  get buffer() {
    return Buffer.from(this.data_);
  }

  appendBuffer(buffer: Buffer) {
    for (let i = 0; i < buffer.length; i++) {
      this.data_.push(buffer[i]);
    }
  }

  appendByte(byte: number) {
    this.data_.push(byte & 0xff);
  }

  appendShort(num: number) {
    for (let i = 0; i < 2; i++) {
      this.data_.push(num & 0xff);
      num >>= 8;
    }
  }

  appendInt(num: number) {
    for (let i = 0; i < 4; i++) {
      this.data_.push(num & 0xff);
      num >>= 8;
    }
  }

  appendString(str: string, translated = false) {
    const buffer = iconv.encode(
      str,
      translated ? WolfContext.writeEncoding : WolfContext.readEncoding,
    );
    this.appendInt(buffer.length + 1);
    this.appendBuffer(buffer);
    this.appendByte(0);
  }

  appendTString(str: TranslationString) {
    this.appendString(str.text, str.isTranslated);
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

  appendIntArray(ints: number[], appendCountFn = DefaultAppendValueFn) {
    this.appendCustomArray(
      ints,
      (stream, num) => stream.appendInt(num),
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
