import {
  CommandLineAction,
  ICommandLineActionOptions,
} from '@rushstack/ts-command-line';
import { logger } from '../logger';
import { RewtOptions } from '../operation/options';

export abstract class BaseAction extends CommandLineAction {
  public constructor(options: ICommandLineActionOptions) {
    super(options);
  }

  public abstract buildOptions(options: RewtOptions): void;
  protected abstract execute(): Promise<void>;

  protected async onExecute(): Promise<void> {
    try {
      await this.execute();
    } catch (e) {
      logger.error(e.stack || e);
      process.exit(1);
    }
  }
}
