import { CommandLineStringParameter } from '@rushstack/ts-command-line';
import { ApplyPatch } from '../operation/apply';
import { ApplyOptions, RewtOptions } from '../operation/options';
import { BaseAction } from './base-action';

export class ApplyAction extends BaseAction {
  protected outDir_: CommandLineStringParameter;
  protected options_: ApplyOptions;

  public constructor() {
    super({
      actionName: 'apply',
      summary: 'Apply patched translation to the game.',
      documentation:
        'Write updated game files into output directory, which will be cleared before generating data files from patch.',
    });
  }

  public override buildOptions(options: RewtOptions) {
    this.options_ = {
      ...options,
      outDir: this.outDir_.value,
    };
  }

  protected override onDefineParameters(): void {
    this.outDir_ = this.defineStringParameter({
      parameterLongName: '--output',
      parameterShortName: '-o',
      argumentName: 'OUT_DIR',
      description:
        'Output directory for patched game files (use a nonexistent directory if possible since it will be cleared before write).',
    });
  }

  protected override async execute(): Promise<void> {
    ApplyPatch(this.options_);
  }
}
