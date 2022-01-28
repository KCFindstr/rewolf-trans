import { WolfCommand } from '../archive/wolf-command';
import { WolfEvent, WolfEventPage } from '../archive/wolf-events';
import { CTX } from '../constants';
import { safeJoin } from './string-utils';
import { TranslationContext } from './translation-context';

export class MapEventContext extends TranslationContext {
  constructor(
    public mapName: string,
    public eventNum: number,
    public pageNum: number,
    public lineNum: number,
    public commandName: string,
  ) {
    super();
  }

  override get key(): string {
    return safeJoin([CTX.NUM.MPS, this.mapName, this.eventNum, this.pageNum]);
  }

  override toString(): string {
    return `${CTX.STR.MPS}:${safeJoin([
      this.mapName,
      'events',
      this.eventNum,
      'pages',
      this.pageNum,
      this.lineNum,
      this.commandName,
    ])}`;
  }

  static FromData(
    mapName: string,
    event: WolfEvent,
    page: WolfEventPage,
    cmdIndex: number,
    command: WolfCommand,
  ) {
    const name = command.constructor.name;
    if (!name.endsWith('Command')) {
      throw new Error(`Unknown command type: ${name}`);
    }
    return new MapEventContext(
      mapName,
      event.id,
      page.id + 1,
      cmdIndex + 1,
      name.substring(0, name.length - 7),
    );
  }

  static FromPath(path: string[]): MapEventContext {
    if (path.length !== 7) {
      throw new Error(`Invalid MapEvent path: ${path}`);
    }
    const [
      mapName,
      eventStr,
      eventNum,
      pagesStr,
      pageNum,
      lineNum,
      commandName,
    ] = path;
    if (eventStr !== 'events') {
      throw new Error(`Invalid MapEvent path: ${path}`);
    }
    if (pagesStr !== 'pages') {
      throw new Error(`Invalid MapEvent path: ${path}`);
    }
    return new MapEventContext(
      mapName,
      Number(eventNum),
      Number(pageNum),
      Number(lineNum),
      commandName,
    );
  }
}
