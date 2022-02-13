import { BufferStream } from '../archive/buffer-stream';
import { WOLF_MAP } from './constants';
import { FileCoder } from '../archive/file-coder';
import { IAppendContext, ISerializable } from '../interfaces';
import { RouteCommand } from './route-command';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';
import { noop } from '../util';
import { TranslationString } from '../translation/translation-string';
import { PatchFileCategory } from '../translation/translation-entry';

export class WolfCommand implements ISerializable, IAppendContext {
  public readonly name: string;

  constructor(
    public cid: number,
    public args: number[],
    public stringArgs: TranslationString[],
    public indent: number,
  ) {
    const name = this.constructor.name;
    if (!name.endsWith('Command')) {
      throw new Error(`Unknown command type: ${name}`);
    }
    this.name = name.substring(0, name.length - 7);
  }

  get category(): PatchFileCategory {
    return PatchFileCategory.Danger;
  }

  serialize(stream: BufferStream): void {
    stream.appendByte(this.args.length + 1);
    stream.appendInt(this.cid);
    stream.appendIntArray(this.args, noop);
    stream.appendByte(this.indent);
    stream.appendTStringArray(this.stringArgs, (s, value) =>
      s.appendByte(value),
    );
    this.writeTeminator(stream);
  }

  writeTeminator(stream: BufferStream) {
    stream.appendByte(0);
  }

  getTexts(): TranslationString[] {
    return this.stringArgs;
  }

  // For map events
  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    ctxBuilder.enter(this.name);
    dict.addTexts(ctxBuilder, this.category, this.getTexts());
    ctxBuilder.leave(this.name);
  }
}

export class WolfExtraCommand extends WolfCommand {
  override get category(): PatchFileCategory {
    return PatchFileCategory.Extra;
  }
}

export class WolfNormalCommand extends WolfCommand {
  override get category(): PatchFileCategory {
    return PatchFileCategory.Normal;
  }
}

export class WolfWarnCommand extends WolfCommand {
  override get category(): PatchFileCategory {
    return PatchFileCategory.Warn;
  }
}

export class BlankCommand extends WolfCommand {}

export class CheckpointCommand extends WolfCommand {}

export class MessageCommand extends WolfNormalCommand {}

export class ChoicesCommand extends WolfNormalCommand {}

export class CommentCommand extends WolfExtraCommand {}

export class ForceStopMessageCommand extends WolfCommand {}

export class DebugMessageCommand extends WolfExtraCommand {}

export class ClearDebugTextCommand extends WolfCommand {}

export class VariableConditionCommand extends WolfCommand {}

export class StringConditionCommand extends WolfNormalCommand {}

export class SetVariableCommand extends WolfCommand {}

export class SetStringCommand extends WolfNormalCommand {}

export class InputKeyCommand extends WolfCommand {}

export class SetVariableExCommand extends WolfCommand {}

export class AutoInputCommand extends WolfCommand {}

export class BanInputCommand extends WolfCommand {}

export class TeleportCommand extends WolfCommand {}

export class SoundCommand extends WolfCommand {}

export enum PictureCommandType {
  Invalid = -1,
  PicFile = 0,
  FileString = 1,
  PicText = 2,
  WindowFile = 3,
  WindowString = 4,
}
export class PictureCommand extends WolfNormalCommand {
  get type(): PictureCommandType {
    const typ = (this.args[0] >> 4) & 0x07;
    if (typ <= PictureCommandType.WindowString) {
      return typ as PictureCommandType;
    }
    return PictureCommandType.Invalid;
  }

  get num() {
    return this.args[1];
  }

  set num(value: number) {
    this.args[1] = value;
  }

  override getTexts() {
    if (this.type !== PictureCommandType.PicText) {
      return [];
    }
    return super.getTexts();
  }

  get filename() {
    if (
      this.type !== PictureCommandType.PicFile &&
      this.type !== PictureCommandType.WindowFile
    ) {
      throw new Error(`Picture type ${this.type} does not have filename`);
    }
    return this.stringArgs[0].text;
  }

  set filename(value: string) {
    if (
      this.type !== PictureCommandType.PicFile &&
      this.type !== PictureCommandType.WindowFile
    ) {
      throw new Error(`Picture type ${this.type} does not have filename`);
    }
    this.stringArgs[0].text = value;
  }
}

export class ChangeColorCommand extends WolfCommand {}

export class SetTransitionCommand extends WolfCommand {}

export class PrepareTransitionCommand extends WolfCommand {}

export class ExecuteTransitionCommand extends WolfCommand {}

export class StartLoopCommand extends WolfCommand {}

export class BreakLoopCommand extends WolfCommand {}

export class BreakEventCommand extends WolfCommand {}

export class EraseEventCommand extends WolfCommand {}

export class ReturnToTitleCommand extends WolfCommand {}

export class EndGameCommand extends WolfCommand {}

export class LoopToStartCommand extends WolfCommand {}

export class StopNonPicCommand extends WolfCommand {}

export class ResumeNonPicCommand extends WolfCommand {}

export class LoopTimesCommand extends WolfCommand {}

export class WaitCommand extends WolfCommand {}

export class MoveCommand extends WolfCommand {
  unknown: Buffer;
  flags: number;
  routes: RouteCommand[];

  constructor(
    cid: number,
    args: number[],
    stringArgs: TranslationString[],
    indent: number,
    file?: FileCoder,
  ) {
    super(cid, args, stringArgs, indent);
    this.unknown = file.readBytes(5);
    this.flags = file.readByte();
    this.routes = file.readArray((f) => new RouteCommand(f));
  }

  override writeTeminator(stream: BufferStream): void {
    stream.appendByte(WOLF_MAP.MOVE_COMMAND_TERMINATOR);
    stream.appendBuffer(this.unknown);
    stream.appendByte(this.flags);
    stream.appendSerializableArray(this.routes);
  }
}

export class WaitForMoveCommand extends WolfCommand {}

export class CommonEventCommand extends WolfCommand {}

export class CommonEventReserveCommand extends WolfCommand {}

export class SetLabelCommand extends WolfCommand {}

export class JumpLabelCommand extends WolfCommand {}

export class SaveLoadCommand extends WolfCommand {}

export class LoadGameCommand extends WolfCommand {}

export class SaveGameCommand extends WolfCommand {}

export class MoveDuringEventOnCommand extends WolfCommand {}

export class MoveDuringEventOffCommand extends WolfCommand {}

export class ChipCommand extends WolfCommand {}

export class ChipSetCommand extends WolfCommand {}

export class ChipOverwriteCommand extends WolfCommand {}

export class DatabaseCommand extends WolfWarnCommand {}

export class ImportDatabaseCommand extends WolfCommand {}

export class PartyCommand extends WolfCommand {}

export class MapEffectCommand extends WolfCommand {}

export class ScrollScreenCommand extends WolfCommand {}

export class EffectCommand extends WolfCommand {}

export class CommonEventByNameCommand extends WolfCommand {}

export class ChoiceCaseCommand extends WolfCommand {}

export class SpecialChoiceCaseCommand extends WolfCommand {}

export class ElseCaseCommand extends WolfCommand {}

export class CancelCaseCommand extends WolfCommand {}

export class LoopEndCommand extends WolfCommand {}

export class BranchEndCommand extends WolfCommand {}

type WolfCommandType = {
  new (
    cid: number,
    args: number[],
    stringArgs: TranslationString[],
    indent: number,
  ): WolfCommand;
};

export const NAME_TO_CLASS: Record<string, WolfCommandType> = {
  Blank: BlankCommand,
  Checkpoint: CheckpointCommand,
  Message: MessageCommand,
  Choices: ChoicesCommand,
  Comment: CommentCommand,
  ForceStopMessage: ForceStopMessageCommand,
  DebugMessage: DebugMessageCommand,
  ClearDebugText: ClearDebugTextCommand,
  VariableCondition: VariableConditionCommand,
  StringCondition: StringConditionCommand,
  SetVariable: SetVariableCommand,
  SetString: SetStringCommand,
  InputKey: InputKeyCommand,
  SetVariableEx: SetVariableExCommand,
  AutoInput: AutoInputCommand,
  BanInput: BanInputCommand,
  Teleport: TeleportCommand,
  Sound: SoundCommand,
  Picture: PictureCommand,
  ChangeColor: ChangeColorCommand,
  SetTransition: SetTransitionCommand,
  PrepareTransition: PrepareTransitionCommand,
  ExecuteTransition: ExecuteTransitionCommand,
  StartLoop: StartLoopCommand,
  BreakLoop: BreakLoopCommand,
  BreakEvent: BreakEventCommand,
  EraseEvent: EraseEventCommand,
  ReturnToTitle: ReturnToTitleCommand,
  EndGame: EndGameCommand,
  LoopToStart: LoopToStartCommand,
  StopNonPic: StopNonPicCommand,
  ResumeNonPic: ResumeNonPicCommand,
  LoopTimes: LoopTimesCommand,
  Wait: WaitCommand,
  Move: MoveCommand,
  WaitForMove: WaitForMoveCommand,
  CommonEvent: CommonEventCommand,
  CommonEventReserve: CommonEventReserveCommand,
  SetLabel: SetLabelCommand,
  JumpLabel: JumpLabelCommand,
  SaveLoad: SaveLoadCommand,
  LoadGame: LoadGameCommand,
  SaveGame: SaveGameCommand,
  MoveDuringEventOn: MoveDuringEventOnCommand,
  MoveDuringEventOff: MoveDuringEventOffCommand,
  Chip: ChipCommand,
  ChipSet: ChipSetCommand,
  ChipOverwrite: ChipOverwriteCommand,
  Database: DatabaseCommand,
  ImportDatabase: ImportDatabaseCommand,
  Party: PartyCommand,
  MapEffect: MapEffectCommand,
  ScrollScreen: ScrollScreenCommand,
  Effect: EffectCommand,
  CommonEventByName: CommonEventByNameCommand,
  ChoiceCase: ChoiceCaseCommand,
  SpecialChoiceCase: SpecialChoiceCaseCommand,
  ElseCase: ElseCaseCommand,
  CancelCase: CancelCaseCommand,
  LoopEnd: LoopEndCommand,
  BranchEnd: BranchEndCommand,
};

export const CID_TO_CLASS: Record<number, WolfCommandType> = {
  0: BlankCommand,
  99: CheckpointCommand,
  101: MessageCommand,
  102: ChoicesCommand,
  103: CommentCommand,
  105: ForceStopMessageCommand,
  106: DebugMessageCommand,
  107: ClearDebugTextCommand,
  111: VariableConditionCommand,
  112: StringConditionCommand,
  121: SetVariableCommand,
  122: SetStringCommand,
  123: InputKeyCommand,
  124: SetVariableExCommand,
  125: AutoInputCommand,
  126: BanInputCommand,
  130: TeleportCommand,
  140: SoundCommand,
  150: PictureCommand,
  151: ChangeColorCommand,
  160: SetTransitionCommand,
  161: PrepareTransitionCommand,
  162: ExecuteTransitionCommand,
  170: StartLoopCommand,
  171: BreakLoopCommand,
  172: BreakEventCommand,
  173: EraseEventCommand,
  174: ReturnToTitleCommand,
  175: EndGameCommand,
  176: StartLoopCommand,
  177: StopNonPicCommand,
  178: ResumeNonPicCommand,
  179: LoopTimesCommand,
  180: WaitCommand,
  201: MoveCommand, // special case
  202: WaitForMoveCommand,
  210: CommonEventCommand,
  211: CommonEventReserveCommand,
  212: SetLabelCommand,
  213: JumpLabelCommand,
  220: SaveLoadCommand,
  221: LoadGameCommand,
  222: SaveGameCommand,
  230: MoveDuringEventOnCommand,
  231: MoveDuringEventOffCommand,
  240: ChipCommand,
  241: ChipSetCommand,
  242: ChipOverwriteCommand,
  250: DatabaseCommand,
  251: ImportDatabaseCommand,
  270: PartyCommand,
  280: MapEffectCommand,
  281: ScrollScreenCommand,
  290: EffectCommand,
  300: CommonEventByNameCommand,
  401: ChoiceCaseCommand,
  402: SpecialChoiceCaseCommand,
  420: ElseCaseCommand,
  421: CancelCaseCommand,
  498: LoopEndCommand,
  499: BranchEndCommand,
};

export function createCommand(file: FileCoder): WolfCommand {
  const argCount = file.readByte();
  const cid = file.readUIntLE();
  const args = file.readUIntArray(() => argCount - 1);
  const indent = file.readByte();
  const stringArgs = file.readTStringArray((f) => f.readByte());
  const terminator = file.readByte();
  if (terminator === WOLF_MAP.MOVE_COMMAND_TERMINATOR) {
    return new MoveCommand(cid, args, stringArgs, indent, file);
  } else if (terminator === WOLF_MAP.COMMAND_TERMINATOR) {
    let commandClass = CID_TO_CLASS[cid];
    if (!commandClass) {
      file.info(`Unknown command: ${cid}`);
      commandClass = WolfCommand;
    }
    return new commandClass(cid, args, stringArgs, indent);
  }
}
