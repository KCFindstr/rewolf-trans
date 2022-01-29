export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class RewolfTransLogger {
  constructor(public logLevel = LogLevel.INFO) {}

  public log(level: LogLevel, ...args: any[]) {
    if (level < this.logLevel) {
      return;
    }
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
        console.error(...args);
        break;
      default:
        console.log(...args);
    }
  }

  public debug(...args: any[]) {
    this.log(LogLevel.DEBUG, ...args);
  }

  public info(...args: any[]) {
    this.log(LogLevel.INFO, ...args);
  }

  public warn(...args: any[]) {
    this.log(LogLevel.WARN, ...args);
  }

  public error(...args: any[]) {
    this.log(LogLevel.ERROR, ...args);
  }
}

export const logger = new RewolfTransLogger();
