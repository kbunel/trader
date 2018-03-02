import * as moment from 'moment';
import { Promise } from 'es6-promise';
import { Wallet } from '../models/wallet.model';
import { NewOrder } from '../models/newOrder.model';
import { BinanceEnum } from '../enums/binance.enum';
import { Order } from '../models/order.model';
import Logger from '../logger';
import AccountManager from '../managers/account.manager';
import BinanceRest from 'binance';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import { ExchangeInfo, ExLotSizeFilter, ExSymbol } from '../models/exchangeInfo.model';
import { TickerEnum } from '../enums/ticker.enum';
import SocketManager from './socket.manager';
import { SymbolPriceTickerModel } from '../models/symbolPriceTicker.model';
import { CancelOrderResponse } from '../models/cancelOrderReponse.model';
import { ExecutionReport } from '../models/executionReport.model';
import Trader from '../tools/trader.service';
import { BestCoin } from '../models/bestCoin.model';
import { TickerModel } from '../models/ticker.model';

export default class OrderManager {

    public readonly NO_ORDERS_FOUND: string = 'no orders found';
    public readonly ORDERS_FOUND: string = 'orders found';
    public readonly ORDERS_FOUND_WITH_ERRORS: string = 'orders found with errors';

    public readonly CURRENT_ORDER_STATUS: Array<string> = [
        BinanceEnum.ORDER_STATUS_NEW,
        BinanceEnum.ORDER_STATUS_PARTIALLY_FILLED
    ];

    private currentOrders: Order[] = [];
    private logger: Logger;
    private exchangeInfo: ExchangeInfo;

    constructor(private binanceRest: BinanceRest,
        private accountManager: AccountManager,
        private socketManager: SocketManager,
        private trader: Trader) {
        this.logger = new Logger();

        this.logger.log('Activating OrderManager');

        this.subscribeToEvents();
        this.getCurrentOrdersFromBinance();
        this.getExchangeInfosFromBinance();
    }

    public buyIfPossible(symbolToBuy: string): void {
        const symboleToTrade: Wallet = this.accountManager.getInWallet(SymbolToTrade.DEFAULT);
        if (Number(symboleToTrade.free) >= 0.001) {
            this.logger.log(SymbolToTrade.DEFAULT + ' still available in the wallet, let\'s buy some ' + symbolToBuy);
            this.createNewBuyOrder(symbolToBuy);
        }
    }

    public sellEverything(except: string = null): void {
        const wallet = this.accountManager.getWallet();
        this.logger.details('Going to sell everything in wallet except ' + except + ' and ' + SymbolToTrade.DEFAULT, wallet);

        let ordersSent: number = 0;
        for (const w of wallet) {
            if (w.asset !== SymbolToTrade.DEFAULT
                && !(except !== null && w.asset === except)
                && Number(w.free) >= this.getMinQtyTradable(w.asset)
                && this.getCurrentOrders(w.asset).length === 0) {

                ordersSent++;
                this.createNewSellOrder(w.asset)
                    .then((newSellOrder: NewOrder) => {
                        this.sendNewOrder(newSellOrder);
                    })
                    .catch((error) => {
                        this.logger.error('Error while creating a new sell order, trying to sell everything...', error);
                    });
            }
        }
        this.logger.log(ordersSent + ' orders have been sent');
    }

    public resetOrdersIfTooLong(min: number, best: BestCoin): Promise<any> {
        return new Promise((resolve, reject) => {
            this.logger.log('Checking orders');

            const promises: Promise<any>[] = [];
            for (const order of this.getCurrentOrders()) {

                const trTime = moment.unix(Math.floor(((order.time) ? order.time : order.transactTime) / 1000));
                this.logger.log('Order sent to ' + order.side + ' ' + order.symbol + ' at ' + trTime.format('MMMM Do YYYY, h:mm:ss a'));
                const orderTicker: TickerModel = this.socketManager.getTicker(order.symbol, '');
                const maxDiffAllowed: number = process.env.FORCE_MARKET_PRICE_PERCENT_MORE;
                if (moment().isAfter(trTime.add(min, 'm'))
                || (orderTicker && best.percent_change > Number(orderTicker.priceChangePercent) + maxDiffAllowed)) {
                    this.logger.log('Order #' + order.orderId + 'for ' + order.symbol
                        + ' (' + Number(orderTicker.priceChangePercent) + ') '
                        + ' is going to be reset to the market price');


                    promises.push(this.cancelOrder(order)
                        .then((orderCanceled: CancelOrderResponse) => {
                            this.sendNewOrder(this.createNewOrderFromOrder(order))
                                .then((orderSent: Order) => {
                                    resolve(orderSent);
                                })
                                .catch((error) => {
                                    reject(error);
                                });
                        })
                        .catch((error) => {
                            reject(error);
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
                this.logger.log('No order to reset');
                resolve(this.NO_ORDERS_FOUND);
            }
        });
    }

    public createNewBuyOrder(symbolToBuy: string, type: BinanceEnum = BinanceEnum.ORDER_TYPE_LIMIT): Promise<NewOrder> {
        this.logger.log('Creating new buy order (' + symbolToBuy + SymbolToTrade.DEFAULT + ')');

        return new Promise((resolve, reject) => {
            this.trader.getPrice(symbolToBuy, SymbolToTrade.DEFAULT, TickerEnum.BEST_BID)
                .then((price: number) => {
                    const absoluteQty = Number(this.accountManager.getInWallet(SymbolToTrade.DEFAULT).free) / price;
                    const quantity: number = this.getValidQuantity(symbolToBuy, absoluteQty);
                    const symbol: string = symbolToBuy + SymbolToTrade.DEFAULT;
                    const side: BinanceEnum = BinanceEnum.SIDE_BUY;

                    const order = this.createNewOrder(symbol, side, price, quantity, type);
                    resolve(order);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    public createNewSellOrder(symbolToSell: string, type: BinanceEnum = BinanceEnum.ORDER_TYPE_LIMIT): Promise<NewOrder> {
        this.logger.log('Creating new sell order (' + symbolToSell + SymbolToTrade.DEFAULT + ')');

        return new Promise((resolve, reject) => {
            this.trader.getPrice(symbolToSell, SymbolToTrade.DEFAULT, TickerEnum.BEST_ASK_PRICE)
                .then((price: number) => {
                    const quantity: number = this.getValidQuantityFromWallet(this.accountManager.getInWallet(symbolToSell));
                    const symbol: string = symbolToSell + SymbolToTrade.DEFAULT;
                    const side: BinanceEnum = BinanceEnum.SIDE_SELL;

                    const order = this.createNewOrder(symbol, side, price, quantity, type);
                    resolve(order);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    public setExchangeInfo(exchangeInfo: ExchangeInfo) {
        this.exchangeInfo = exchangeInfo;
    }

    public getExchangeInfo(): ExchangeInfo {
        return this.exchangeInfo;
    }

    public getCurrentOrders(symbol: string = null): Order[] {
        this.logger.log('Getting current orders' + ((symbol) ? ' for ' + symbol : ''));

        const reg = (symbol) ? new RegExp(symbol) : null;
        const orders: Order[] = [];
        for (const order of this.currentOrders) {
            if (order.status !== BinanceEnum.ORDER_STATUS_FILLED
                && order.status !== BinanceEnum.ORDER_STATUS_CANCELED
                && order.status !== BinanceEnum.ORDER_STATUS_EXPIRED
                && order.status !== BinanceEnum.ORDER_STATUS_REJECTED) {
                // Experienced a 'cannot use .match of undefined...'
                try {
                    if (reg && order.symbol.match(reg)) {
                        orders.push(order);
                    } else {
                        orders.push(order);
                    }
                } catch (error) {
                    this.logger.details('Error with', order, error);
                }
            }
        }
        this.logger.details('Retrieved ' + orders.length
            + ' orders from current orders'
            + ((symbol) ? ' for ' + symbol : ''), orders);
        return orders;
    }

    public setCurrentOrders(currentOrders: Order[]): void {
        this.currentOrders = currentOrders;
    }

    public addOrder(order: Order): void {
        for (const i in this.currentOrders) {
            if (this.currentOrders[+i].orderId === order.orderId) {
                this.currentOrders.splice(+i, 1);
                break;
            }
        }
        this.currentOrders.push(order);
    }

    public addOrders(orders: Order[]) {
        for (const order of orders) {
            this.addOrder(order);
        }
    }

    public removeOrder(orderId: number): void {
        for (const i in this.getCurrentOrders()) {
            if (this.currentOrders[+i].orderId === orderId) {
                this.logger.details('Order #' + this.currentOrders[+i].orderId + ' removed', this.currentOrders[+i]);

                this.currentOrders.splice(+i, 1);
            }
        }
    }

    public cancelAllOrders(symbolToNotCancel: string = null): Promise<any> {
        this.logger.log('Cancelling all orders');

        return new Promise((resolve, reject) => {
            const promises: Promise<any>[] = [];

            this.getCurrentOrdersFromBinance()
                .then((orders: Order[]) => {
                    for (const order of orders) {
                        if (symbolToNotCancel && order.symbol === symbolToNotCancel) {
                            continue;
                        }
                        promises.push(this.cancelOrder(order));
                    }
                })
                .catch((err) => {
                    reject(err);
                    return;
                });

            if (!promises) {
                this.logger.log('No order to cancel');
                return;
            }

            Promise.all(promises)
                .then((results) => {
                    // for (const r of results) { }
                    this.logger.details('Successfully canceled all orders', results);

                    resolve(results);
                })
                .catch((errors) => {
                    this.logger.error('Errors while canceling orders', errors);
                    reject(errors);
                });
        });
    }

    public sendNewOrder(newOrder: NewOrder): Promise<Order> {
        this.logger.details('Sending order: ', newOrder.getParameters());
        return new Promise((resolve, reject) => {
            this.binanceRest.newOrder(newOrder.getParameters(), (err, order: Order) => {
                if (err) {
                    this.logger.error('Error trying to send an order', err);
                    reject(err);
                }
                if (order) {
                    this.logger.details('New order sent', order);
                    this.addOrder(order);
                    resolve(order);
                }
            });
        });
    }

    public cancelOrder(order: Order): Promise<any> {
        this.logger.details('Cancelling order', order);

        return new Promise((resolve, reject): any => {
            this.binanceRest.cancelOrder({
                symbol: order.symbol,
                orderId: order.orderId,
                timestamp: Date.now()
            }, (err, orderCanceled: CancelOrderResponse) => {
                if (err) {
                    this.logger.log(err);
                    this.getCurrentOrdersFromBinance();
                    reject(err);
                }
                if (orderCanceled) {
                    this.logger.details('Canceled order #' + orderCanceled.orderId, orderCanceled);
                    this.removeOrder(orderCanceled.orderId);
                    resolve(orderCanceled);
                }
            });
        });
    }

    public getCurrentOrdersFromBinance(): Promise<any> {
        this.logger.log('Getting current orders from Binance');

        return new Promise((resolve, reject): any => {
            this.binanceRest.openOrders({}, (err, orders: Order[]) => {
                if (err) {
                    this.logger.log('Error from openOrders', err);
                    reject(err);
                }
                if (orders) {
                    this.logger.log(orders.length + ' orders retrieved from Binance', orders);
                    this.setCurrentOrders(orders);
                    resolve(orders);
                }
            });
        });
    }

    public getMinQtyTradable(symbol: string): number {
        this.logger.logIf(false, 'Getting min qty traddable');

        const exLotSizeFilter: ExLotSizeFilter = this.getLotSizeFilter(this.getSymbolFromExchangeInfo(symbol));
        return Number(exLotSizeFilter.minQty);
    }

    private createNewOrder(tradeSymbol: string, side: BinanceEnum, price: number, quantity: number, type: BinanceEnum): NewOrder {
        if (process.env.FORCE_PRICE_MARKET === 'true') {
            type = BinanceEnum.ORDER_TYPE_MARKET;
        }
        const newOrder = new NewOrder({
            symbol: tradeSymbol,
            type: type,
            side: side,
            quantity: quantity,
            timestamp: Date.now()
        });

        if (type !== BinanceEnum.ORDER_TYPE_MARKET) {
            newOrder.timeInForce = BinanceEnum.TIME_IN_FORCE_GTC;
            newOrder.price = price;
        }
        return newOrder;
    }

    private getValidQuantityFromWallet(wallet: Wallet): number {
        const exLotSizeFilter: ExLotSizeFilter = this.getLotSizeFilter(this.getSymbolFromExchangeInfo(wallet.asset));
        const minQty = Number(exLotSizeFilter.minQty);
        const precision = (minQty < 1) ? minQty.toString().split('.')[1].length : 0;
        const left = wallet.free.split('.')[0];
        const right = wallet.free.split('.')[1].substring(0, precision);

        return Number(left + '.' + right);
    }

    private getValidQuantity(symbol: string, qty: number): number {
        const exLotSizeFilter: ExLotSizeFilter = this.getLotSizeFilter(this.getSymbolFromExchangeInfo(symbol));
        const minQty = Number(exLotSizeFilter.minQty);
        const precision = (minQty < 1) ? minQty.toString().split('.')[1].length : 0;
        const left = qty.toString().split('.')[0];
        const right = qty.toString().split('.')[1].substring(0, precision);

        return Number(left + '.' + right);
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
            symbol: order.symbol,
            type: BinanceEnum.ORDER_TYPE_MARKET,
            side: order.side === BinanceEnum.SIDE_BUY ? BinanceEnum.SIDE_BUY : BinanceEnum.SIDE_SELL,
            quantity: Number(order.origQty) - Number(order.executedQty),
            timestamp: Date.now()
        });
    }

    private getLotSizeFilter(symbol: ExSymbol): ExLotSizeFilter {
        return symbol.filters[1];
    }

    private getSymbolFromExchangeInfo(symbol: string): ExSymbol {
        this.logger.logIf(false, 'Getting symbol [' + symbol + SymbolToTrade.DEFAULT + '].');

        for (const s of this.getExchangeInfo().symbols) {
            if (s.symbol === symbol + SymbolToTrade.DEFAULT) {
                return s;
            }
        }
        this.logger.log('Didnt get symbol ' + symbol + ' ...');
        return null;
    }

    private subscribeToEvents(): void {
        this.socketManager.eventEmitter.on('executionReport', (executionReport: ExecutionReport) => {
            this.logger.details('Received execution report from Binance in orderManager', executionReport);

            this.updateOrders(executionReport);
        });
    }

    private updateOrders(executionReport: ExecutionReport): void {
        switch (executionReport.orderStatus) {
            case BinanceEnum.ORDER_STATUS_FILLED
                || BinanceEnum.ORDER_STATUS_EXPIRED
                || BinanceEnum.ORDER_STATUS_CANCELED
                || BinanceEnum.ORDER_STATUS_REJECTED:

            this.removeOrder(executionReport.orderId);

            break;
            case BinanceEnum.ORDER_STATUS_NEW
                || BinanceEnum.ORDER_STATUS_PARTIALLY_FILLED
                || BinanceEnum.ORDER_STATUS_PENDING_CANCEL:

            this.updateOrderFromReport(executionReport);
            break;
            default:
                this.logger.details('Received an execution report but didnt get anything to to with', executionReport);
        }
    }

    private updateOrderFromReport(executionReport: ExecutionReport): void {
        this.logger.log('Updating current order #' + executionReport.orderId + ' (' + executionReport.orderStatus + ')');
        for (const i in this.currentOrders) {
            if (this.currentOrders[+i].orderId === executionReport.orderId) {
                this.logger.log('Found order #' + executionReport.orderId + ' in currentOrders, updating');

                this.currentOrders[+i].clientOrderId = executionReport.newClientOrderId;
                this.currentOrders[+i].side = executionReport.side;
                this.currentOrders[+i].type = executionReport.orderType;
                this.currentOrders[+i].quantity = executionReport.quantity;
                this.currentOrders[+i].price = executionReport.price;
                this.currentOrders[+i].stopPrice = executionReport.stopPrice;
                this.currentOrders[+i].executionType = executionReport.executionType;

                return;
            }
        }
        this.logger.log('Order #' + executionReport.orderId + ' not found in current orders...');
    }
}
