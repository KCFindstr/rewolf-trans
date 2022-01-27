import { BufferStream } from '../buffer-stream';
import { FileCoder } from './file-coder';

export interface ISerializable {
  serialize(stream: BufferStream): void;
}

export interface IProjectData {
  readData(file: FileCoder, ...args: any[]): void;
  serializeData(stream: BufferStream): void;
  serializeProject(stream: BufferStream): void;
}
