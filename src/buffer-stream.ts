import * as iconv from 'iconv-lite';
import { WolfContext } from './archive/wolf-context';

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

  appendString(str: string) {
    const buffer = iconv.encode(str, 'Shift_JIS');
    this.appendInt(buffer.length + 1);
    this.appendBuffer(buffer);
    this.appendByte(0);
  }

  appendLocaleString(str: string) {
    const buffer = iconv.encode(str, WolfContext.writeEncoding);
    this.appendInt(buffer.length + 1);
    this.appendBuffer(buffer);
    this.appendByte(0);
  }
}
