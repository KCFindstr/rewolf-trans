import { BufferStream } from '../buffer-stream';
import { WOLF_MAP } from '../constants';
import { FileCoder } from './file-coder';
import { IContextSupplier, ISerializable } from '../interfaces';
import { RouteCommand } from './route-command';
import { createCommand, WolfCommand } from './wolf-command';
import { TranslationDict } from '../translation/translation-dict';
import { ContextBuilder } from '../translation/context-builder';

export class WolfEvent implements ISerializable, IContextSupplier {
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
      ctxBuilder.enter(page.id + 1);
      page.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(page.id + 1);
    }
  }

  serialize(stream: BufferStream) {
    stream.appendBuffer(WOLF_MAP.EVENT_START);
    stream.appendInt(this.id);
    stream.appendString(this.name);
    stream.appendInt(this.x);
    stream.appendInt(this.y);
    stream.appendInt(this.pages.length);
    stream.appendBuffer(WOLF_MAP.EVENT_END);
    for (const page of this.pages) {
      stream.appendByte(WOLF_MAP.PAGE_INDICATOR);
      page.serialize(stream);
    }
    stream.appendByte(WOLF_MAP.PAGE_FINISH_INDICATOR);
  }
}

export class WolfEventPage implements ISerializable, IContextSupplier {
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
    const routeCount = this.file.readUIntLE();
    this.routes = [];
    for (let i = 0; i < routeCount; i++) {
      this.routes.push(new RouteCommand(this.file));
    }

    // Read commands
    const commandCount = this.file.readUIntLE();
    this.commands = [];
    for (let i = 0; i < commandCount; i++) {
      this.commands.push(createCommand(this.file));
    }
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
      ctxBuilder.enter(i + 1);
      this.commands[i].appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i + 1);
    }
  }

  serialize(stream: BufferStream) {
    stream.appendInt(this.unknown1);
    stream.appendString(this.graphicName);
    stream.appendByte(this.graphicDirection);
    stream.appendByte(this.graphicFrame);
    stream.appendByte(this.graphicOpacity);
    stream.appendByte(this.graphicRenderMode);
    stream.appendBuffer(this.conditions);
    stream.appendBuffer(this.movement);
    stream.appendByte(this.flags);
    stream.appendByte(this.routeFlags);
    stream.appendSerializableArray(this.routes);
    stream.appendSerializableArray(this.commands);
    stream.appendBuffer(WOLF_MAP.COMMAND_END);
    stream.appendByte(this.shadowGraphicNum);
    stream.appendByte(this.collisionWidth);
    stream.appendByte(this.collisionHeight);
    stream.appendByte(WOLF_MAP.PAGE_END);
  }
}
