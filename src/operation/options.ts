import { logger, LogLevel } from '../logger';

export interface RewtOptions {
  game: string;
  gameDir: string;
  patchDir: string;
  readEncoding: string;
  writeEncoding: string;
  verbose: boolean;
}

export interface ApplyOptions extends RewtOptions {
  outDir: string;
}

export interface GenerateOptions extends RewtOptions {
  sourceDirs?: string[];
}

export const DefaultOptions: RewtOptions = {
  game: '',
  gameDir: '',
  patchDir: '',
  readEncoding: 'SHIFT_JIS',
  writeEncoding: 'GBK',
  verbose: false,
};

export const DefaultApplyOptions: ApplyOptions = {
  ...DefaultOptions,
  outDir: '',
};

export const DefaultGenerateOptions: GenerateOptions = {
  ...DefaultOptions,
};

export const GlobalOptions: RewtOptions = {
  ...DefaultOptions,
};

export function SetGlobalOptions(
  options: RewtOptions,
  defaults: RewtOptions = DefaultOptions,
) {
  Object.assign(GlobalOptions, defaults, options);
  if (GlobalOptions.verbose) {
    logger.logLevel = LogLevel.DEBUG;
  } else {
    logger.logLevel = LogLevel.INFO;
  }
}
