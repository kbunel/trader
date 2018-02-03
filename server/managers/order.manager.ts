import { Promise } from 'es6-promise';
import { Wallet } from '../models/wallet.model';
import { NewOrder } from '../models/newOrder.model';
import { BinanceEnum } from '../enums/binance.enum';
import { Order } from '../models/order.model';
import Logger from '../logger';
import AccountManager from '../managers/account.manager';
import BinanceRest from 'binance';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import Transactions from '../Transactions';
import { ExchangeInfo, ExLotSizeFilter, ExSymbol } from '../models/exchangeInfo.model';
import { TickerEnum } from '../enums/ticker.enum';

export default class OrderManager {

    public readonly NO_ORDERS_FOUND: string = 'no orders found';
    public readonly ORDERS_FOUND: string = 'orders found';
    public readonly ORDERS_FOUND_WITH_ERRORS: string = 'orders found with errors';

    private currentOrders: Order[];
    private logger: Logger;
    private accountManager: AccountManager;
    private binanceRest: BinanceRest;
    private transactions: Transactions;
    private exchangeInfo: ExchangeInfo;

    constructor(binanceRest: BinanceRest, accountManager: AccountManager, transactions: Transactions) {
        this.binanceRest = binanceRest;
        this.accountManager = accountManager;
        this.logger = new Logger();
        this.transactions = transactions;

        this.getCurrentOrdersFromBinance();
        this.getExchangeInfosFromBinance();
    }

    public sellEverything(except: string = null): void {
        this.logger.log('Going to sell everything in wallet except ' + SymbolToTrade.DEFAULT);

        const wallet = this.accountManager.getWallet();
        console.log(wallet);
        for (const w of wallet) {
            console.log(w);
            if (w.asset !== SymbolToTrade.DEFAULT
                && !(except !== null && w.asset === except)
                && Number(w.free) >= this.getMinQtyTradable(w.asset)) {

                this.sendNewOrder(this.createNewSellOrder(w.asset));
            } else {
                this.logger.log('Cannot sell anything from ' + w.asset);
            }
        }
        this.logger.log('All orders have been sent');
    }

    public resetOrdersIfTooLong(min: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.logger.log('Checking orders');

            const promises: Promise<any>[] = [];
            for (const order of this.getCurrentOrders()) {
                if (Number(order.time) + min * 60 * 1000 < Date.now()) {

                    this.logger.log('Order #' + order.orderId + 'for ' + order.symbol +
                    ' is pending since more than 5 minutes cancelling and putting it back to the market value');

                    promises.push(
                        this.cancelOrder(order)
                        .then(() => {
                            this.sendNewOrder(this.createNewOrderFromOrder(order));
                        })
                    );

                }
            }

            if (promises.length) {
                Promise.all(promises)
                .then((results) => {
                    this.logger.details('All orders have been reset', results);

                    this.getCurrentOrdersFromBinance()
                    .then(() => {
                        resolve(this.NO_ORDERS_FOUND);
                    })
                    .catch((error) => {
                        resolve(this.ORDERS_FOUND_WITH_ERRORS);
                    });
                })
                .catch((errors) => {
                    this.logger.error('Errors while reseting orders', errors);
                    resolve(this.ORDERS_FOUND_WITH_ERRORS);
                });
            } else {
                this.logger.log('No open orders found');
                resolve(this.NO_ORDERS_FOUND);
            }
        });
    }

    public createNewBuyOrder(symbolToBuy: string,  type: BinanceEnum = BinanceEnum.ORDER_TYPE_LIMIT): NewOrder {
        this.logger.log('Creating new buy order (' + symbolToBuy + SymbolToTrade.DEFAULT + ')');

        const price: number = this.getPrice(symbolToBuy);
        const quantity: number = Number(this.accountManager.getInWallet(SymbolToTrade.DEFAULT).free) / price;
        const symbol: string = symbolToBuy + SymbolToTrade.DEFAULT;
        const side: BinanceEnum = BinanceEnum.SIDE_BUY;

        return this.createNewOrder(symbol, side, price, quantity, type);
    }

    public createNewSellOrder(symbolToSell: string, type: BinanceEnum = BinanceEnum.ORDER_TYPE_LIMIT): NewOrder {
        this.logger.log('Creating new sell order (' + symbolToSell + SymbolToTrade.DEFAULT + ')');

        const price: number = this.getPrice(symbolToSell);
        const qtyFixed = this.getQuantityPrecision(symbolToSell);
        const quantity: number = Number(Number(this.accountManager.getInWallet(symbolToSell).free).toFixed(qtyFixed));
        const symbol: string = symbolToSell + SymbolToTrade.DEFAULT;
        const side: BinanceEnum = BinanceEnum.SIDE_SELL;

        return this.createNewOrder(symbol, side, price, quantity, type);
    }

    public setCurrentOrders(currentOrders: Order[]) {
        this.currentOrders = currentOrders;
    }

    public getCurrentOrders(): Order[] {
        return this.currentOrders;
    }

    public setExchangeInfo(exchangeInfo: ExchangeInfo) {
        this.exchangeInfo = exchangeInfo;
    }

    public getExchangeInfo(): ExchangeInfo {
        console.log('Getting exchange info');
        return this.exchangeInfo;
    }

    public getCurrentOrder(symbol: string) {
        const orders: Order[] = [];
        for (const order of this.getCurrentOrders()) {
            if (order.symbol === symbol) {
                orders.push(order);
            }
        }
        return orders;
    }

    public cancelAllOrders(): Promise<any> {
        this.logger.log('Cancelling all orders');

        return new Promise((resolve, reject) => {
            const promises: Promise<any>[] = [];

            for (const order of this.getCurrentOrders()) {
                promises.push(this.cancelOrder(order));
            }

            Promise.all(promises)
            .then((results) => {
                this.logger.details('Successfully canceled all orders', results);
                resolve(results);
            })
            .catch((errors) => {
                this.logger.error('Errors while canceling orders', errors);
                reject(errors);
            });
        });
    }

    public sendNewOrder(newOrder: NewOrder): void {
        this.logger.details('Sending order: ', newOrder.getParameters());

        this.binanceRest.newOrder(newOrder.getParameters(), (err, data) => {
            if (err) { console.log('err', err); }
            if (data) { console.log('data', data); }
        });
    }

    private cancelOrder(order: Order): Promise<any> {
        this.logger.details('Cancelling order', order);
        return new Promise((resolve, reject): any => {
            this.binanceRest.cancelOrder({
                symbol: order.symbol,
                timestamp: order.time
            }, (err, data) => {
                if (err) { this.logger.log(err); }
                if (data) { this.logger.log(data); }
                resolve();
            });
        });
    }

    public getCurrentOrdersFromBinance(): Promise<any> {
        return new Promise((resolve, reject): any => {
            this.binanceRest.openOrders()
            .then((dataOrders: Order[]) => {
                this.setCurrentOrders(dataOrders);
                this.logger.details('Retrieved open orders informations from Binance', this.getCurrentOrders());
                resolve(dataOrders);
            })
            .catch((error) => {
                this.logger.error('Error while retriving open orders from Binance', error);
                reject(error);
            });
        });
    }

    public getMinQtyTradable(symbol: string): number {
        this.logger.log('Getting min qty traddable');
        const exLotSizeFilter: ExLotSizeFilter = this.getLotSizeFilter(this.getSymbolFromExchangeInfo(symbol));
        console.log('lotSize filter -----------> ', exLotSizeFilter);
        return Number(exLotSizeFilter.minQty);
    }

    private createNewOrder(tradeSymbol: string, side: BinanceEnum, price: number,  quantity: number, type: BinanceEnum): NewOrder {
        const newOrder = new NewOrder({
            symbol: tradeSymbol,
            type: type,
            side: side,
            quantity: quantity,
            timestamp: Date.now()
        });

        newOrder.timeInForce = BinanceEnum.TIME_IN_FORCE_GTC;
        newOrder.price = price;
        return newOrder;
    }

    private getQuantityPrecision(symbol): number {
        const exLotSizeFilter: ExLotSizeFilter = this.getLotSizeFilter(this.getSymbolFromExchangeInfo(symbol));
        return Number(exLotSizeFilter.minQty).toString().split('.')[1].length;
    }

    private getExchangeInfosFromBinance(): void {
        this.binanceRest.exchangeInfo()
        .then((exchangeInfo: ExchangeInfo) => {
            this.setExchangeInfo(exchangeInfo);
            this.logger.details('Retrieved Exchange Info from Binance', this.getExchangeInfo());
        })
        .catch((error) => {
            this.logger.error('Error while retriving Exchange Info from Binance', error);
        });
    }

    private getTypeFromOrder(type: string): BinanceEnum {
        switch (type) {
            case BinanceEnum.ORDER_TYPE_LIMIT:
                return BinanceEnum.ORDER_TYPE_LIMIT;
            case BinanceEnum.ORDER_TYPE_LIMIT_MAKER:
                return BinanceEnum.ORDER_TYPE_LIMIT_MAKER;
            case BinanceEnum.ORDER_TYPE_MARKET:
                return BinanceEnum.ORDER_TYPE_MARKET;
            case BinanceEnum.ORDER_TYPE_STOP_LOSS:
                return BinanceEnum.ORDER_TYPE_STOP_LOSS;
            case BinanceEnum.ORDER_TYPE_STOP_LOSS_LIMIT:
                return BinanceEnum.ORDER_TYPE_STOP_LOSS_LIMIT;
            case BinanceEnum.ORDER_TYPE_TAKE_PROFIT:
                return BinanceEnum.ORDER_TYPE_TAKE_PROFIT;
            case BinanceEnum.ORDER_TYPE_TAKE_PROFIT_LIMIT:
                return BinanceEnum.ORDER_TYPE_TAKE_PROFIT_LIMIT;
            case BinanceEnum.ORDER_TYPE_TAKE_PROFIT_LIMIT:
                return BinanceEnum.ORDER_TYPE_TAKE_PROFIT_LIMIT;
            default:
                this.logger.log('Type ' + type + ' not found in BiannceEnum');
                return null;
        }
    }

    // Create an order at market price from another order
    private createNewOrderFromOrder(order: Order): NewOrder {
        this.logger.details('Creating new order from another order (' + order.symbol + ')', order);

        return new NewOrder({
            symbol: order.symbol + SymbolToTrade.DEFAULT,
            type: this.getTypeFromOrder(order.type),
            side: order.side === BinanceEnum.SIDE_BUY ? BinanceEnum.SIDE_BUY : BinanceEnum.SIDE_SELL,
            quantity: Number(order.origQty) - Number(order.executedQty),
            timestamp: Date.now()
        });
    }

    private getLotSizeFilter(symbol: ExSymbol): ExLotSizeFilter {
        console.log('Getting min filter for min Qty');
        return symbol.filters[1];
    }

    private getSymbolFromExchangeInfo(symbol: string): ExSymbol {
        console.log('Getting symbol [' + symbol + SymbolToTrade.DEFAULT + '].');
        for (const s of this.exchangeInfo.symbols) {
            if (s.symbol === symbol + SymbolToTrade.DEFAULT) {
                return s;
            }
        }
        console.log('Didnt get symbol ' + symbol + ' ...');
        return null;
    }

    private getPrice(symbol, priceKind: TickerEnum = TickerEnum.BEST_ASK_PRICE): number {
        for (const ticker of this.transactions.allTickers) {
            if (symbol + SymbolToTrade.DEFAULT === ticker.symbol) {
              const price = Number((priceKind === TickerEnum.BEST_ASK_PRICE) ? ticker.bestAskPrice : ticker.bestBid);
                return Number(price.toFixed(8));
            }
        }
        this.logger.log('Price for ' + symbol + SymbolToTrade.DEFAULT + ' not found ...');
        return null;
    }
}
