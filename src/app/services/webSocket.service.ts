import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { AggTradeModel } from '@models/aggTrade.model';
import { DepthModel } from '@models/depth.model';
import { DepthLevelModel } from '@models/depthLevel.model';
import { KlineModel } from '@models/kline.model';
import { TickerModel } from '@models/Ticker.model';
import { TradeModel } from '@models/trade.model';
import { Subject } from 'rxjs/Subject';
import * as io from 'socket.io-client';

@Injectable()
export class WebSocketService {

  public logs: any[string] = [];
  public trade: TradeModel = new TradeModel();
  public aggTrade: AggTradeModel = new AggTradeModel();
  public depth: DepthModel = new DepthModel();
  public depthLevel: DepthLevelModel = new DepthLevelModel();
  public kline: KlineModel = new KlineModel();
  public ticker: TickerModel = new TickerModel();
  public allTickers: TickerModel[] = [];

  public logsSubscribe: Subject<any[string]> = new Subject();
  public tradeSubscribe: Subject<TradeModel> = new Subject();
  public aggTradeSubscribe: Subject<AggTradeModel> = new Subject();
  public depthSubscribe: Subject<DepthModel> = new Subject();
  public depthLevelSubscribe: Subject<DepthLevelModel> = new Subject();
  public klineSubscribe: Subject<KlineModel> = new Subject();
  public tickerSubscribe: Subject<TickerModel> = new Subject();
  public allTickersSubscribe: Subject<TickerModel[]> = new Subject();

  constructor() {
    const socket = io(environment.url.webSocket);

    socket.on('logs', (data: any[string]): void => this.logsSubscribe.next(this.logs = data));
    socket.on('trade', (data: TradeModel): void => this.tradeSubscribe.next(this.trade = data));
    socket.on('aggTrade', (data: AggTradeModel): void => this.aggTradeSubscribe.next(this.aggTrade = data));
    socket.on('depth', (data: DepthModel): void => this.depthSubscribe.next(this.depth = data));
    socket.on('depthLevel', (data: DepthLevelModel): void => this.depthLevelSubscribe.next(this.depthLevel = data));
    socket.on('kline', (data: KlineModel): void => this.klineSubscribe.next(this.kline = data));
    socket.on('ticker', (data: TickerModel): void => this.tickerSubscribe.next(this.ticker = data));
    socket.on('allTickers', (data: TickerModel[]): void => this.allTickersSubscribe.next(this.allTickers = data));
  }
}

