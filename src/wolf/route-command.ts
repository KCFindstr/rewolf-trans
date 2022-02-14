import { BufferStream } from '../archive/buffer-stream';
import { WOLF_MAP } from './constants';
import { FileCoder } from '../archive/file-coder';
import { ISerializable } from '../interfaces';

export class RouteCommand implements ISerializable {
  id: number;
  args: number[];
  constructor(file: FileCoder) {
    this.id = file.readByte();
    this.args = file.readUIntArray((f) => f.readByte());
    file.expect(WOLF_MAP.ROUTE_COMMAND_TERMINATOR);
  }

  serialize(stream: BufferStream): void {
    stream.appendByte(this.id);
    stream.appendIntArrayLE(this.args, (s, val) => s.appendByte(val));
    stream.appendBytes(WOLF_MAP.ROUTE_COMMAND_TERMINATOR);
  }
}
