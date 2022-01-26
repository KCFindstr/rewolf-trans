import * as fs from 'fs';
import * as path from 'path';
import { FileCoder } from './file-coder';
import { ISerializable } from './interfaces';
import { ensureDir } from '../util';
import { BufferStream } from '../buffer-stream';

export abstract class WolfArchive implements ISerializable {
  protected file: FileCoder;

  constructor(filename: string) {
    this.file = new FileCoder(filename);
  }

  get buffer() {
    return this.file.buffer;
  }

  get filename() {
    return this.file.filename;
  }

  get isValid() {
    return this.file.isValid;
  }

  abstract serialize(stream: BufferStream): void;

  abstract parse(): void;

  write(filepath: string) {
    const stream = new BufferStream();
    this.serialize(stream);
    ensureDir(path.dirname(filepath));
    fs.writeFileSync(filepath, stream.buffer);
  }
}
