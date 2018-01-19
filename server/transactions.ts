import 'dotenv/config';
import * as api from 'binance';
import { Client } from 'node-rest-client';
import * as socketio from 'socket.io';

import { BinanceEnum } from './enum';

import { FrontModel } from './models/front.model';
import { AggTradeModel } from './models/aggTrade.model';
import { DepthModel } from './models/depth.model';
import { DepthLevelModel } from './models/depthLevel.model';
import { KlineModel } from './models/kline.model';
import { TickerModel } from './models/ticker.model';
import { TradeModel } from './models/trade.model';
import { CoinMarketCapModel } from './models/coinmarketcap.model';

export default class Transactions {
  public symbol: string = String(process.env.SYMBOL);
  public interval: string = String(process.env.INTERVAL);

  public front: FrontModel = new FrontModel();

  public trade: TradeModel = new TradeModel();
  public aggTrade: AggTradeModel = new AggTradeModel();
  public depth: DepthModel = new DepthModel();
  public depthLevel: DepthLevelModel = new DepthLevelModel();
  public kline: KlineModel = new KlineModel();
  public ticker: TickerModel = new TickerModel();
  public allTickers: TickerModel[] = [];
  public allKlines: KlineModel[] = [];
  public coinmarketcap: CoinMarketCapModel[] = [];

  private io = null;
  private request = null;
  private binanceWS = null;
  private binanceRest = null;

  /**
   *
   * @param server
   */
  constructor(server) {
    this.binanceRest = new api.BinanceRest({
      key: String(process.env.APIKEY),
      secret: String(process.env.APISECRET),
    });

    this.binanceRest.klines({
      symbol: this.symbol,
      interval: this.interval
    })
      .then((data: KlineModel[]) => this.allKlines = data)
      .catch(console.error);

    this.io = socketio(server);

    this.request = new Client();

    this.front.symbol = this.symbol;
    this.front.interval = this.interval;

    this.socket();
    this.dataGlobal();
  }

  /**
   *
   * @param value
   */
  public changeConfig(value: any): void {
    if (typeof value.symbol !== 'undefined') {
      this.symbol = this.front.symbol = value.symbol.trim().toUpperCase();
    }
    if (typeof value.interval !== 'undefined') {
      this.interval = this.front.interval = value.interval.trim().toLowerCase();
    }

    this.socket();
  }

  /**
   *
   */
  public sendDataFront(): void {
    this.io.sockets.emit('front', this.front);
  }

  /**
   *
   */
  public haveOrder(): Promise<boolean> {
    return this.binanceRest.openOrders({
      symbol: this.symbol,
      timestamp: Date.now()
    })
      .then((dataOrders: any) => this.front.haveOrder = !!dataOrders.length);
  }

  /**
   *
   */
  public sendOrder(side: string, price: number): Promise<boolean> {
    // newOrder
    return this.binanceRest[process.env.SEND_ORDER_TEST === 'true' ? 'testOrder' : 'newOrder'](this.front.lastOrder = {
      symbol: this.symbol,
      type: BinanceEnum.ORDER_TYPE_LIMIT,
      timeInForce: BinanceEnum.TIME_IN_FORCE_GTC,
      timestamp: Date.now(),
      quantity: process.env.QUANTITY,
      price,
      side
    })
      .then((dataOrders: any) => this.front.haveOrder = !!dataOrders.length)
      .catch(console.error);
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
            this.io.sockets.emit('depth', this.depth = streamEvent.data);
            break;
          case binanceWS.streams.depthLevel(this.symbol, 5):
            this.io.sockets.emit('depthLevel', this.depthLevel = streamEvent.data);
            break;
          case binanceWS.streams.kline(this.symbol, this.interval):
            this.io.sockets.emit('kline', this.kline = streamEvent.data);
            break;
          case binanceWS.streams.aggTrade(this.symbol):
            this.io.sockets.emit('aggTrade', this.aggTrade = streamEvent.data);
            break;
          case binanceWS.streams.trade(this.symbol):
            this.io.sockets.emit('trade', this.trade = streamEvent.data);
            break;
          case binanceWS.streams.ticker(this.symbol):
            this.io.sockets.emit('ticker', this.ticker = streamEvent.data);
            break;
          case binanceWS.streams.allTickers():
            this.io.sockets.emit('allTickers', this.allTickers = streamEvent.data);
            break;
        }
      }
    );
  }

  private dataGlobal(): void {
    this.request.get(process.env.API_COINMARKETCAP, (data) => {
      this.io.sockets.emit('coinmarketcap', this.coinmarketcap = data);
      setTimeout(() => this.dataGlobal(), 5 * 1000);
    });
  }
}
