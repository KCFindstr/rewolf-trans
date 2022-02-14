import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { logger } from '../logger';
import { TranslationString } from '../translation/translation-string';
import { GlobalOptions } from '../operation/options';
import { ICrypko } from '../interfaces';

export type ReadValueFn = (file: FileCoder) => number;

const DefaultReadValueFn: ReadValueFn = (file) => file.readUIntLE();

export class FileCoder {
  protected buffer_: Buffer;
  protected offset_: number;
  protected offsetHistory_: number[] = [];

  constructor(
    protected readonly filename_: string,
    protected crypko_?: ICrypko,
    buffer?: Buffer,
  ) {
    try {
      if (!buffer) {
        buffer = fs.readFileSync(filename_);
      }
      if (this.crypko_) {
        this.crypko_.setData(buffer);
        this.buffer_ = this.crypko_.decrypt();
      } else {
        this.buffer_ = buffer;
      }
    } catch (e) {
      logger.info(`Failed to read ${filename_}: ${e.stack || e}`);
      this.buffer_ = null;
    }
    this.offset_ = 0;
  }

  get isValid() {
    return this.buffer_.length > 0;
  }

  get isEncrypted(): boolean {
    return this.crypko_?.isEncrypted;
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

  get offset() {
    return this.offset_;
  }

  pushPtr(offset: number) {
    this.offsetHistory_.push(this.offset_);
    this.offset_ = offset;
  }

  popPtr() {
    this.assert(this.offsetHistory_.length > 0, 'Popping empty offset stack');
    this.offset_ = this.offsetHistory_.pop();
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

  info(msg: string) {
    logger.info(`${this.locstr} > ${msg}`);
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

  // Read string until null terminator
  readStringUnsafe(encoding = GlobalOptions.readEncoding) {
    const start = this.offset;
    while (this.readByte() !== 0);
    return iconv.decode(this.buffer.slice(start, this.offset), encoding);
  }

  readString(
    readLenFn: ReadValueFn = DefaultReadValueFn,
    encoding = GlobalOptions.readEncoding,
  ): string {
    const len = readLenFn(this);
    this.assert(len > 0, `Unexpected string length ${len}`);
    const bytes = this.readBytes(len - 1);
    this.expectByte(0);
    const str = iconv.decode(bytes, encoding);
    return str;
  }

  readTString(
    readLenFn: ReadValueFn = DefaultReadValueFn,
    encoding = GlobalOptions.readEncoding,
  ): TranslationString {
    return TranslationString.FromRawStr(this.readString(readLenFn, encoding));
  }

  readTStringUnsafe(encoding = GlobalOptions.readEncoding): TranslationString {
    return TranslationString.FromRawStr(this.readStringUnsafe(encoding));
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

  readUIntLEArray(readCountFn = DefaultReadValueFn): number[] {
    return this.readArray((file) => file.readUIntLE(), readCountFn);
  }

  readByteArray(readCountFn = DefaultReadValueFn): number[] {
    return this.readArray((file) => file.readByte(), readCountFn);
  }

  readStringArray(
    readCountFn = DefaultReadValueFn,
    readStrLenFn = DefaultReadValueFn,
  ): string[] {
    return this.readArray((file) => file.readString(readStrLenFn), readCountFn);
  }

  readTStringArray(
    readCountFn = DefaultReadValueFn,
    readStrLenFn = DefaultReadValueFn,
  ): TranslationString[] {
    return this.readArray(
      (file) => file.readTString(readStrLenFn),
      readCountFn,
    );
  }

  skip(count = 1) {
    this.assertLength(count);
    this.offset_ += count;
  }
}
