import { BufferStream } from '../archive/buffer-stream';
import { WOLF_MAP } from './constants';
import { FileCoder } from '../archive/file-coder';
import { IAppendContext, ISerializable } from '../interfaces';
import { RouteCommand } from './route-command';
import { createCommand, WolfCommand } from './wolf-command';
import { TranslationDict } from '../translation/translation-dict';
import { ContextBuilder } from '../translation/context-builder';

export class WolfEvent implements ISerializable, IAppendContext {
  id: number;
  name: string;
  x: number;
  y: number;
  pages: WolfEventPage[];

  constructor(readonly file: FileCoder) {
    // Read header
    this.file.expect(WOLF_MAP.EVENT_START);
    this.id = this.file.readUIntLE();
    this.name = this.file.readString();
    this.x = this.file.readUIntLE();
    this.y = this.file.readUIntLE();
    const pageCount = this.file.readUIntLE();
    this.file.expect(WOLF_MAP.EVENT_END);

    // Read pages
    let indicator: number;
    this.pages = [];
    while ((indicator = this.file.readByte()) === WOLF_MAP.PAGE_INDICATOR) {
      this.pages.push(new WolfEventPage(this.file, this.pages.length));
    }
    this.file.assert(
      indicator === WOLF_MAP.PAGE_FINISH_INDICATOR,
      `Unexpected page indicator ${indicator}`,
    );
    this.file.assert(
      pageCount === this.pages.length,
      `Expected ${pageCount} pages but got ${this.pages.length}`,
    );
  }

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    for (const page of this.pages) {
      ctxBuilder.enter(page.id);
      page.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(page.id);
    }
  }

  serialize(stream: BufferStream) {
    stream.appendBytes(WOLF_MAP.EVENT_START);
    stream.appendIntLE(this.id);
    stream.appendString(this.name);
    stream.appendIntLE(this.x);
    stream.appendIntLE(this.y);
    stream.appendIntLE(this.pages.length);
    stream.appendBytes(WOLF_MAP.EVENT_END);
    for (const page of this.pages) {
      stream.appendByte(WOLF_MAP.PAGE_INDICATOR);
      page.serialize(stream);
    }
    stream.appendByte(WOLF_MAP.PAGE_FINISH_INDICATOR);
  }
}

export class WolfEventPage implements ISerializable, IAppendContext {
  unknown1: number;
  graphicName: string;
  graphicDirection: number;
  graphicFrame: number;
  graphicOpacity: number;
  graphicRenderMode: number;
  conditions: Buffer;
  movement: Buffer;
  flags: number;
  routeFlags: number;
  routes: RouteCommand[];
  commands: WolfCommand[];
  shadowGraphicNum: number;
  collisionWidth: number;
  collisionHeight: number;

  constructor(readonly file: FileCoder, readonly id: number) {
    // Read header
    this.unknown1 = this.file.readUIntLE();
    this.graphicName = this.file.readString();
    this.graphicDirection = this.file.readByte();
    this.graphicFrame = this.file.readByte();
    this.graphicOpacity = this.file.readByte();
    this.graphicRenderMode = this.file.readByte();
    this.conditions = this.file.readBytes(1 + 4 + 4 * 4 + 4 * 4);
    this.movement = this.file.readBytes(4);
    this.flags = this.file.readByte();
    // Read routes
    this.routeFlags = this.file.readByte();
    this.routes = this.file.readArray((f) => new RouteCommand(f));

    // Read commands
    this.commands = this.file.readArray((f) => createCommand(f));
    this.file.expect(WOLF_MAP.COMMAND_END);

    // Read other options
    this.shadowGraphicNum = this.file.readByte();
    this.collisionWidth = this.file.readByte();
    this.collisionHeight = this.file.readByte();

    const terminator = this.file.readByte();
    this.file.assert(
      terminator === WOLF_MAP.PAGE_END,
      `Unexpected page terminator ${terminator}`,
    );
  }

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    for (let i = 0; i < this.commands.length; i++) {
      const cmd = this.commands[i];
      ctxBuilder.enter(i, cmd.name);
      cmd.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
    }
  }

  serialize(stream: BufferStream) {
    stream.appendIntLE(this.unknown1);
    stream.appendString(this.graphicName);
    stream.appendByte(this.graphicDirection);
    stream.appendByte(this.graphicFrame);
    stream.appendByte(this.graphicOpacity);
    stream.appendByte(this.graphicRenderMode);
    stream.appendBytes(this.conditions);
    stream.appendBytes(this.movement);
    stream.appendByte(this.flags);
    stream.appendByte(this.routeFlags);
    stream.appendSerializableArray(this.routes);
    stream.appendSerializableArray(this.commands);
    stream.appendBytes(WOLF_MAP.COMMAND_END);
    stream.appendByte(this.shadowGraphicNum);
    stream.appendByte(this.collisionWidth);
    stream.appendByte(this.collisionHeight);
    stream.appendByte(WOLF_MAP.PAGE_END);
  }
}
