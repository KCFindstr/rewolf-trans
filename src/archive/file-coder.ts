import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { WolfContext } from './wolf-context';

export class FileCoder {
  protected buffer_: Buffer;
  protected offset_: number;
  protected context_: string[];

  constructor(protected readonly filename_: string) {
    this.buffer_ = fs.readFileSync(filename_);
    this.offset_ = 0;
  }

  get isValid() {
    return this.buffer_.length > 0;
  }

  get filename() {
    return this.filename_;
  }

  get buffer() {
    return this.buffer_;
  }

  get posstr() {
    return `${this.filename_}:${this.offset_.toString(16)}`;
  }

  get context() {
    return this.context_;
  }

  get isEof() {
    return this.offset_ === this.buffer_.length;
  }

  enterContext(name: string) {
    this.context_.push(name);
  }

  leaveContext() {
    this.assert(this.context_.length > 0, 'Context stack is empty');
    this.context_.pop();
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

  assert(condition: boolean, msg = 'Assertion failed') {
    if (!condition) {
      throw new Error(`${this.posstr} > ${msg}`);
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
}
