import 'dotenv/config';
import * as api from 'binance';
import * as socketio from 'socket.io';

export default class Websocket {
  public symbol: string = String(process.env.SYMBOL);
  public interval: string = String(process.env.INTERVAL);

  private io = null;
  private binanceWS = null;

  constructor(server) {
    this.io = socketio(server);

    this.socket();
  }

  /**
   *
   * @param value
   */
  public changeConfig(value: any): void {
    if (typeof value.symbol !== 'undefined') {
      this.symbol = value.symbol.trim().toUpperCase();
    }
    if (typeof value.interval !== 'undefined') {
      this.interval = value.interval.trim().toLowerCase();
    }

    console.log(this.interval, this.symbol);
    this.socket();
  }

  /**
   *
   * @param {string} value
   */
  public log(value: string): void {
    this.io.sockets.emit('log', value);
  }

  /**
   *
   */
  private socket(): void {
    if (this.binanceWS) {
      this.binanceWS.terminate();
    }

    const binanceWS = new api.BinanceWS(true);

    this.binanceWS = binanceWS.onCombinedStream(
      [
        binanceWS.streams.depth(this.symbol),
        binanceWS.streams.depthLevel(this.symbol, 5),
        binanceWS.streams.kline(this.symbol, '5m'),
        binanceWS.streams.aggTrade(this.symbol),
        binanceWS.streams.trade(this.symbol),
        binanceWS.streams.ticker(this.symbol),
        binanceWS.streams.allTickers()
      ],
      (streamEvent) => {
        switch (streamEvent.stream) {
          case binanceWS.streams.depth(this.symbol):
            this.io.sockets.emit('depth', streamEvent.data);
            break;
          case binanceWS.streams.depthLevel(this.symbol, 5):
            this.io.sockets.emit('depthLevel', streamEvent.data);
            break;
          case binanceWS.streams.kline(this.symbol, '5m'):
            this.io.sockets.emit('kline', streamEvent.data);
            break;
          case binanceWS.streams.aggTrade(this.symbol):
            this.io.sockets.emit('aggTrade', streamEvent.data);
            break;
          case binanceWS.streams.trade(this.symbol):
            this.io.sockets.emit('trade', streamEvent.data);
            break;
          case binanceWS.streams.ticker(this.symbol):
            this.io.sockets.emit('ticker', streamEvent.data);
            break;
          case binanceWS.streams.allTickers():
            this.io.sockets.emit('allTickers', streamEvent.data);
            break;
        }
      }
    );
  }
}
