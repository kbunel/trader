import { BinanceWS, BinanceRest } from 'binance';
import Logger from '../logger';
import { DepthModel } from '../models/depth.model';
import { DepthLevelModel } from '../models/depthLevel.model';
import { KlineModel } from '../models/kline.model';
import { AggTradeModel } from '../models/aggTrade.model';
import { TradeModel } from '../models/trade.model';
import { TickerModel } from '../models/ticker.model';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import { OutboundBalances } from '../models/outboundAccountInfo.model';
import { EventEmitter } from 'events';
import { BinanceEnum } from '../enums/binance.enum';

export default class SocketManager {

    private binanceWS: BinanceWS;
    private combinedWebSocket: BinanceWS;
    private logger;
    private symbolToWatch: string = 'ETHBTC';
    private interval: string = String(process.env.INTERVAL);
    private depth: DepthModel;
    private depthLevel: DepthLevelModel;
    private kline: KlineModel;
    private aggTrade: AggTradeModel;
    private trade: TradeModel;
    private ticker: TickerModel;
    private allTickers: TickerModel[] = [];
    private userData: any;
    private allKlines: KlineModel[] = [];
    private balances: OutboundBalances[] = [];
    public eventEmitter = new EventEmitter();

    constructor(private binanceRest: BinanceRest) {
        this.logger = new Logger();
        this.binanceWS = new BinanceWS();

        this.activateCombinedSockets();
        this.activateKlinesSocket();
        this.activateUserDataSocket();
    }

    public setBalances(balances: OutboundBalances[]) {
        this.balances = balances;
        this.eventEmitter.emit('balances', balances);
    }

    public logDatas(): void {
        this.logger.log('Getting informations retrieved by the Socket Manager');

        this.logger.log('Agg Trade', this.aggTrade);
        this.logger.log('Kline', this.kline);
        this.logger.log('All Klines', this.allKlines);
        this.logger.log('Ticker', this.ticker);
        this.logger.log('All Tickers', this.allTickers);
        this.logger.log('Depth', this.depth);
        this.logger.log('Depth Level', this.depthLevel);
        this.logger.log('Trade', this.trade);
        this.logger.log('User Data', this.userData);
    }

    public setSymbolToWatch(symbolToWatch: string, ref: string = SymbolToTrade.DEFAULT): void {
        this.symbolToWatch = symbolToWatch + ref;
    }

    public getSymbolToWatch(): string {
        return this.symbolToWatch;
    }

    public getAllTickers(): TickerModel[] {
        return this.allTickers;
    }

    public getTicker(symbol: string, ref: string = SymbolToTrade.DEFAULT): TickerModel {
        this.logger.log('Looking for ' + symbol + ref + ' in Tickers');
        for (const t of this.getAllTickers()) {
            if (t.symbol === symbol + ref) {
                return t;
            }
        }
        this.logger.detailsIf('Ticker not found in all tickers', this.getAllTickers());
        return null;
    }

    public resetCombinedSocket(): void {
        this.logger.log('Resetting activateCombinedSockets');

        if (this.combinedWebSocket) {
            this.combinedWebSocket.terminate();
        }
        this.activateCombinedSockets();
    }

    private activateKlinesSocket(): void {
        this.logger.log('Activating Klines Socket');

        this.binanceRest.klines({
            symbol: this.symbolToWatch,
            interval: this.interval
        })
        .then((data: KlineModel[]) => this.allKlines = data)
        .catch((error) => {
            this.logger.error('Error getting KlinesSockets', error);
        });
    }

    private activateUserDataSocket(): void {
        this.logger.log('Activating userData socket');

        this.binanceWS.onUserData(this.binanceRest, (data) => {
            this.logger.details('userData', data);

            if (data.eventType === 'outboundAccountInfo') {
                this.setBalances(data.balances);
            }
            if (data.eventType === 'executionReport') {
                this.eventEmitter.emit('executionReport', data);
            }
        }, 60000) // Optional, how often the keep alive should be sent in milliseconds
        .then((ws) => {
            // websocket instance available here
        })
        .catch((error) => {
            this.logger.error('Error getting usearDataSockets', error);
        });
    }

    private addTickers(tickers: TickerModel[]): void {
        this.logger.detailsIf(false, 'Retrieved allTickers from Binances', tickers);

        let updated: boolean;
        for (const ticker of tickers) {
            updated = false;
            for (const i in this.allTickers) {
                if (this.allTickers[+i].symbol === ticker.symbol) {
                    this.allTickers[+i] = ticker;
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                this.allTickers.push(ticker);
            }
        }
    }

    private activateCombinedSockets(): void {
        this.logger.log('Activating sockets from Binance');

        this.combinedWebSocket = this.binanceWS.onCombinedStream(
        [
            this.binanceWS.streams.depth(this.symbolToWatch),
            this.binanceWS.streams.depthLevel(this.symbolToWatch, 5),
            this.binanceWS.streams.kline(this.symbolToWatch, '5m'),
            this.binanceWS.streams.aggTrade(this.symbolToWatch),
            this.binanceWS.streams.trade(this.symbolToWatch),
            this.binanceWS.streams.ticker(this.symbolToWatch),
            this.binanceWS.streams.allTickers()
        ],
        (streamEvent) => {
            switch (streamEvent.stream) {
            case this.binanceWS.streams.depth(this.symbolToWatch):
                this.depth = streamEvent.data;
            break;
            case this.binanceWS.streams.depthLevel(this.symbolToWatch, 5):
                this.depthLevel = streamEvent.data;
            break;
            case this.binanceWS.streams.kline(this.symbolToWatch, this.interval):
                this.kline = streamEvent.data;
            break;
            case this.binanceWS.streams.aggTrade(this.symbolToWatch):
                this.aggTrade = streamEvent.data;
            break;
            case this.binanceWS.streams.trade(this.symbolToWatch):
                this.trade = streamEvent.data;
            break;
            case this.binanceWS.streams.ticker(this.symbolToWatch):
                this.ticker = streamEvent.data;
            break;
            case this.binanceWS.streams.allTickers():
                this.addTickers(streamEvent.data);
            break;
            }
        }
        );
    }
}
