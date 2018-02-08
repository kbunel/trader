export default class Logger {
  public detailActive: boolean = false;

  public log(...args: any[]): void {
    for (const arg of args) {
      console.log(arg);
    }
  }

  public details(info: string, ...details: any[]) {
    if (process.env.LOG_DETAILS_ACTIVE) {
      for (const arg of details) {
        console.log(arg);
      }
    }
    console.log(info);
  }

  public error(...args: any[]) {
    for (const arg of args) {
      console.error(arg);
    }
  }
}
