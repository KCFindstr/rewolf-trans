import { CommandLineStringListParameter } from '@rushstack/ts-command-line';
import { GeneratePatch } from '../operation/generate';
import { GenerateOptions, RewtOptions } from '../operation/options';
import { BaseAction } from './base-action';

export class GenerateAction extends BaseAction {
  protected sourceDirs_: CommandLineStringListParameter;
  protected options_: GenerateOptions;

  public constructor() {
    super({
      actionName: 'generate',
      summary: 'Generate patch files from game archives and source files.',
      documentation:
        'Extract translatable strings. Existing files will be overwritten, so make sure to backup your work and avoid using your working directory as --patch.',
    });
  }

  public override buildOptions(options: RewtOptions) {
    this.options_ = {
      ...options,
      sourceDirs: [...this.sourceDirs_.values],
    };
  }

  protected override onDefineParameters(): void {
    this.sourceDirs_ = this.defineStringListParameter({
      parameterLongName: '--source',
      parameterShortName: '-s',
      argumentName: 'SOURCE_DIR',
      description:
        'Source directories for reading existing patch files. This is useful for upgrading from wolf-trans, but some data might not be preserved.',
    });
  }

  protected override async onExecute(): Promise<void> {
    GeneratePatch(this.options_);
  }
}
