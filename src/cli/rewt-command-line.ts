import {
  CommandLineFlagParameter,
  CommandLineParser,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { RewtOptions } from '../operation/options';
import { ApplyAction } from './apply-action';
import { BaseAction } from './base-action';
import { GenerateAction } from './generate-action';

export class RewtCommandLine extends CommandLineParser {
  private game_: CommandLineStringParameter;
  private gameDir_: CommandLineStringParameter;
  private patchDir_: CommandLineStringParameter;
  private readEncoding_: CommandLineStringParameter;
  private writeEncoding_: CommandLineStringParameter;
  private verbose_: CommandLineFlagParameter;

  private actions_: BaseAction[] = [];

  public constructor() {
    super({
      toolFilename: 'rewolf-trans',
      toolDescription:
        'Extract translatable strings from WolfRPG games and patch data files after translation.',
    });

    this.actions_.push(new GenerateAction());
    this.actions_.push(new ApplyAction());

    this.actions_.forEach((action) => this.addAction(action));
  }

  protected override onDefineParameters(): void {
    this.game_ = this.defineStringParameter({
      parameterLongName: '--game',
      parameterShortName: '-g',
      argumentName: 'GAME',
      description: 'Game name.',
      defaultValue: 'wolf',
    });

    this.gameDir_ = this.defineStringParameter({
      required: true,
      parameterLongName: '--root',
      parameterShortName: '-r',
      argumentName: 'GAME_DIR',
      description: 'Game root directory (where Game.exe lives).',
    });

    this.patchDir_ = this.defineStringParameter({
      required: true,
      parameterLongName: '--patch',
      parameterShortName: '-p',
      argumentName: 'PATCH_DIR',
      description: 'Directory containing patch text files.',
    });

    this.readEncoding_ = this.defineStringParameter({
      parameterLongName: '--renc',
      argumentName: 'READ_ENCODING',
      description: 'Encoding for reading game archive files.',
      defaultValue: 'SHIFT_JIS',
    });

    this.writeEncoding_ = this.defineStringParameter({
      parameterLongName: '--wenc',
      argumentName: 'WRITE_ENCODING',
      description: 'Encoding for writing patched game files.',
      defaultValue: 'GBK',
    });

    this.verbose_ = this.defineFlagParameter({
      parameterLongName: '--verbose',
      parameterShortName: '-v',
      description: 'Output verbose log.',
    });
  }

  protected override async onExecute(): Promise<void> {
    const options: RewtOptions = {
      game: this.game_.value,
      gameDir: this.gameDir_.value,
      patchDir: this.patchDir_.value,
      readEncoding: this.readEncoding_.value,
      writeEncoding: this.writeEncoding_.value,
      verbose: this.verbose_.value,
    };

    this.actions_.forEach((action) => action.buildOptions(options));

    return super.onExecute();
  }
}
