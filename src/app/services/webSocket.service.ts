import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AggTradeModel } from '../models/aggTrade.model';
import { DepthModel } from '../models/depth.model';
import { DepthLevelModel } from '../models/depthLevel.model';
import { KlineModel } from '../models/kline.model';
import { TickerModel } from '../models/Ticker.model';
import { TradeModel } from '../models/trade.model';
import * as io from 'socket.io-client';

@Injectable()
export class WebSocketService {
  public trade: TradeModel = new TradeModel();
  public aggTrade: AggTradeModel = new AggTradeModel();
  public depth: DepthModel = new DepthModel();
  public depthLevel: DepthLevelModel = new DepthLevelModel();
  public kline: KlineModel = new KlineModel();
  public ticker: TickerModel = new TickerModel();
  public allTickers: TickerModel[] = [];

  private url = environment.url.webSocket;
  private socket = null;

  constructor() {
    this.socket = io(this.url);
    this.socket.on('trade', (data: TradeModel) => this.trade = data);
    this.socket.on('aggTrade', (data: AggTradeModel) => this.aggTrade = data);
    this.socket.on('depth', (data: DepthModel) => this.depth = data);
    this.socket.on('depthLevel', (data: DepthLevelModel) => this.depthLevel = data);
    this.socket.on('kline', (data: KlineModel) => this.kline = data);
    this.socket.on('ticker', (data: TickerModel) => this.ticker = data);
    this.socket.on('allTickers', (data: TickerModel[]) => this.allTickers = data);
  }
}

