export default class Logger {
  public detailActive: boolean = false;

  public log(...args: any[]): void {
    for (const arg of args) {
      console.log(arg);
    }
  }

  public details(info: string, ...details: any[]) {
    console.log(info);
    if (process.env.LOG_DETAILS_ACTIVE) {
      for (const arg of details) {
        console.log(arg);
      }
    }
  }
}
