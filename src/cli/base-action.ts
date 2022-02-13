import {
  CommandLineAction,
  ICommandLineActionOptions,
} from '@rushstack/ts-command-line';
import { RewtOptions } from '../operation/options';

export abstract class BaseAction extends CommandLineAction {
  public constructor(options: ICommandLineActionOptions) {
    super(options);
  }

  public abstract buildOptions(options: RewtOptions);
}
