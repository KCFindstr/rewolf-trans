import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { TranslationString } from '../translation/translation-string';
import { Crypko } from './crypko';
import { WolfContext } from './wolf-context';

export type ReadValueFn = (file: FileCoder) => number;

const DefaultReadValueFn: ReadValueFn = (file) => file.readUIntLE();

export class FileCoder {
  protected buffer_: Buffer;
  protected offset_: number;
  protected crypko_: Crypko;

  constructor(protected readonly filename_: string, seedIndices_?: number[]) {
    try {
      const buffer = fs.readFileSync(filename_);
      this.crypko_ = new Crypko(buffer, seedIndices_);
      this.buffer_ = this.crypko_.decrypt();
    } catch (e) {
      console.log(`Failed to read ${filename_}: ${e.stack || e}`);
      this.buffer_ = null;
    }
    this.offset_ = 0;
  }

  get isValid() {
    return this.buffer_.length > 0;
  }

  get isEncrypted() {
    return this.crypko_.isEncrypted;
  }

  get filename() {
    return this.filename_;
  }

  get buffer() {
    return this.buffer_;
  }

  get locstr() {
    return `${this.filename_}:${this.offset_.toString(16)}`;
  }

  get isEof() {
    return this.offset_ === this.buffer_.length;
  }

  get crypko() {
    return this.crypko_;
  }

  expectByte(expected: number) {
    this.assertLength(1);
    this.assert(
      this.buffer_[this.offset_] === expected,
      `Expected ${expected} but got ${this.buffer_[this.offset_]}`,
    );
    this.offset_++;
  }

  expect(expected: Buffer) {
    this.assertLength(expected.length);
    for (let i = 0; i < expected.length; i++) {
      this.assert(
        this.buffer_[this.offset_ + i] === expected[i],
        `Expected [${expected.join(',')}] but got [${this.buffer_
          .slice(this.offset_, this.offset_ + expected.length)
          .join(',')}]`,
      );
    }
    this.offset_ += expected.length;
  }

  log(msg: string) {
    console.log(`${this.locstr} > ${msg}`);
  }

  assert(condition: boolean, msg = 'Assertion failed') {
    if (!condition) {
      throw new Error(`${this.locstr} > ${msg}`);
    }
  }

  assertLength(count: number) {
    this.assert(
      this.offset_ + count <= this.buffer_.length,
      'Unexpected end of file',
    );
  }

  readString(): string {
    const len = this.readUIntLE();
    this.assert(len > 0, `Unexpected string length ${len}`);
    const bytes = this.readBytes(len - 1);
    this.expectByte(0);
    return iconv.decode(bytes, WolfContext.readEncoding);
  }

  readTString(): TranslationString {
    return TranslationString.FromRawStr(this.readString());
  }

  readBytes(count = 1): Buffer {
    this.assertLength(count);
    const result = this.buffer_.slice(this.offset_, this.offset_ + count);
    this.offset_ += count;
    return result;
  }

  readByte(): number {
    this.assertLength(1);
    const ret = this.buffer_.readUInt8(this.offset_);
    this.offset_++;
    return ret;
  }

  readUShortLE(): number {
    this.assertLength(2);
    const ret = this.buffer_.readUInt16LE(this.offset_);
    this.offset_ += 2;
    return ret;
  }

  readUShortBE(): number {
    this.assertLength(2);
    const ret = this.buffer_.readUInt16BE(this.offset_);
    this.offset_ += 2;
    return ret;
  }

  readUIntLE(): number {
    this.assertLength(4);
    const ret = this.buffer_.readUInt32LE(this.offset_);
    this.offset_ += 4;
    return ret;
  }

  readUIntBE(): number {
    this.assertLength(4);
    const ret = this.buffer_.readUInt32BE(this.offset_);
    this.offset_ += 4;
    return ret;
  }

  readArray<T>(
    readFn: (file: FileCoder, arrIndex: number) => T,
    readCountFn = DefaultReadValueFn,
  ): T[] {
    const count = readCountFn(this);
    const ret: T[] = [];
    for (let i = 0; i < count; i++) {
      ret.push(readFn(this, i));
    }
    return ret;
  }

  readUIntArray(readCountFn = DefaultReadValueFn): number[] {
    return this.readArray((file) => file.readUIntLE(), readCountFn);
  }

  readByteArray(readCountFn = DefaultReadValueFn): number[] {
    return this.readArray((file) => file.readByte(), readCountFn);
  }

  readStringArray(readCountFn = DefaultReadValueFn): string[] {
    return this.readArray((file) => file.readString(), readCountFn);
  }

  readTStringArray(readCountFn = DefaultReadValueFn): TranslationString[] {
    return this.readArray((file) => file.readTString(), readCountFn);
  }

  skip(count = 1) {
    this.assertLength(count);
    this.offset_ += count;
  }
}
