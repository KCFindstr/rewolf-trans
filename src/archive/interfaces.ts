import { BufferStream } from '../buffer-stream';

export interface ISerializable {
  serialize(stream: BufferStream): void;
}
