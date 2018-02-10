import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import { TickerEnum } from '../enums/ticker.enum';
import Logger from '../logger';
import SocketManager from '../managers/socket.manager';
import BinanceRest from 'binance';
import { SymbolPriceTickerModel } from '../models/symbolPriceTicker.model';
import { Promise } from 'es6-promise';

export default class Trader {

    constructor(private logger: Logger,
                private socketManager: SocketManager,
                private binanceRest: BinanceRest) {
                    this.logger.log('Activating Trader');
                }

    public getPrice(symbol, ref: string = SymbolToTrade.DEFAULT, priceKind: TickerEnum = TickerEnum.BEST_ASK_PRICE): Promise<number> {
        this.logger.log('Looking for the price of ' + symbol + ' in allTicker');

        return new Promise((resolve, reject) => {
            const allTickers = this.socketManager.getAllTickers();
            for (const ticker of allTickers) {
                if (symbol + ref === ticker.symbol) {
                    const price = Number((priceKind === TickerEnum.BEST_ASK_PRICE) ? ticker.bestAskPrice : ticker.bestBid);
                    resolve(price);
                    break;
                }
            }

            this.logger.log('Price not found in allTicker, looking for the price of ' + symbol + ' from Binance');

            this.binanceRest.tickerPrice(symbol + ref, (err, tickerPrice: SymbolPriceTickerModel) => {
                if (err) {
                    this.logger.error('Error while getting last price known from Binance', err);
                    reject(err);
                }
                if (tickerPrice) {
                    this.logger.details('Get latest price known from Binance', tickerPrice);
                    resolve(Number(tickerPrice.price));
                }
            });
        });
    }
}
