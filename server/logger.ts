import * as moment from 'moment';

export default class Logger {
  public detailActive: boolean = false;

  public log(...args: any[]): void {
    for (const arg of args) {
      console.log('[' + moment().format() + '] \x1b[33m%s\x1b[0m', arg);
    }
  }

  public details(info: string, ...details: any[]) {
    if (process.env.LOG_DETAILS_ACTIVE === 'true') {
      let i: number = 0;
      this.logSeparator();
      for (const arg of details) {
        i++;
        if (process.env.LOGET_DETAILS_MINIFIED === 'true' && i === 3) {
          break ;
        }
        console.log(arg);
      }
    }
    console.log('[' + moment().format() + '] \x1b[36m%s\x1b[0m', info);
    this.logSeparator();
  }

  public error(error, ...args: any[]): void {
    for (const arg of args) {
      console.error(arg);
    }
    console.error('[' + moment().format() + '] ', error);
  }

  public logIf(log: boolean, ...args: any[]): void {
    if (log || process.env.LOG_FORCE_IF === 'true') {
      this.log(args);
    }
  }

  public detailsIf(log: boolean, info: string, ...args: any[]) {
      if (log || process.env.LOG_FORCE_IF === 'true') {
      this.details(info, args);
    }
  }

  private logSeparator(): void {
    console.log('-------------------------------');
  }
}
