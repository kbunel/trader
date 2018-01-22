export default class Logger {
  public log(...args: any[]): void {
    for (const arg of args) {
      console.log(arg);
    }
  }
}
