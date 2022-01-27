import { BufferStream } from './buffer-stream';
import { FileCoder } from './archive/file-coder';

export interface ISerializable {
  serialize(stream: BufferStream): void;
}

export interface IProjectData {
  readData(file: FileCoder, ...args: any[]): void;
  serializeData(stream: BufferStream): void;
  serializeProject(stream: BufferStream): void;
}

export interface ICustomKey {
  get key(): string;
}

export interface IString {
  toString(): string;
}
