import { WolfCommand } from '../archive/wolf-command';
import { WolfEvent } from '../archive/wolf-events';
import { CTX } from '../constants';
import { safeJoin } from './string-utils';
import { TranslationContext } from './translation-context';

export class CommonEventContext extends TranslationContext {
  constructor(
    public eventNum: number,
    public lineNum: number,
    public commandName: string,
  ) {
    super();
  }

  override get key(): string {
    return safeJoin([CTX.NUM.CE, this.eventNum]);
  }

  override toString(): string {
    return `${CTX.STR.CE}:${safeJoin([
      this.eventNum,
      this.lineNum,
      this.commandName,
    ])}`;
  }

  static FromData(event: WolfEvent, cmdIndex: number, command: WolfCommand) {
    const name = command.constructor.name;
    if (!name.endsWith('Command')) {
      throw new Error(`Unknown command type: ${name}`);
    }
    return new CommonEventContext(
      event.id,
      cmdIndex,
      name.substring(0, name.length - 7),
    );
  }

  static FromPath(path: string[]): CommonEventContext {
    if (path.length !== 3) {
      throw new Error(`Invalid CommonEvent path: ${safeJoin(path)}`);
    }
    const [eventNum, lineNum, commandName] = path;
    return new CommonEventContext(
      Number(eventNum),
      Number(lineNum),
      commandName,
    );
  }
}
