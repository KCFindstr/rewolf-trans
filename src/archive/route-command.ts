import { BufferStream } from '../buffer-stream';
import { WOLF_MAP } from '../constants';
import { FileCoder } from './file-coder';
import { ISerializable } from './interfaces';

export class RouteCommand implements ISerializable {
  id: number;
  args: number[];
  constructor(file: FileCoder) {
    this.id = file.readByte();
    const argCount = file.readByte();
    this.args = [];
    for (let i = 0; i < argCount; i++) {
      this.args.push(file.readUIntLE());
    }
    file.expect(WOLF_MAP.ROUTE_COMMAND_TERMINATOR);
  }

  serialize(stream: BufferStream): void {
    stream.appendByte(this.id);
    stream.appendByte(this.args.length);
    for (const arg of this.args) {
      stream.appendInt(arg);
    }
    stream.appendBuffer(WOLF_MAP.ROUTE_COMMAND_TERMINATOR);
  }
}
