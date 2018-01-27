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

export default class OrderManager {

    public readonly NO_ORDERS_FOUND: string = 'no orders found';
    public readonly ORDERS_FOUND: string = 'orders found';
    public readonly ORDERS_FOUND_WITH_ERRORS: string = 'orders found with errors';

    private currentOrders: Order[];
    private logger: Logger;
    private accountManager: AccountManager;
    private binanceRest: BinanceRest;
    private transactions: Transactions;

    constructor(binanceRest: BinanceRest, accountManager: AccountManager, transactions: Transactions) {
        this.binanceRest = binanceRest;
        this.accountManager = accountManager;
        this.logger = new Logger();
        this.transactions = transactions;

        this.getCurrentOrdersFromBinance();
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
                            // .then((response) => {
                            //     this.logger.details('New order sent', response);
                            // })
                            // .catch((error) => {
                            //     this.logger.error(error);
                            // });
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

    // Create an order to sell at market price from a Wallet object
    public createNewOrderFromWallet(wallet: Wallet): NewOrder {
        return new NewOrder({
            symbol: wallet.asset + SymbolToTrade.DEFAULT,
            type: BinanceEnum.ORDER_TYPE_MARKET,
            side: BinanceEnum.SIDE_SELL,
            quantity: Number(wallet.free),
            timestamp: Date.now()
        });
    }

    // Create an order at market price from another order
    public createNewOrderFromOrder(order: Order, side: BinanceEnum = BinanceEnum.SIDE_SELL): NewOrder {
        return new NewOrder({
            symbol: order.symbol + SymbolToTrade.DEFAULT,
            type: BinanceEnum.ORDER_TYPE_MARKET,
            side: side,
            quantity: Number(order.origQty) - Number(order.executedQty),
            timestamp: Date.now()
        });
    }

    public createNewOrderFromSymbol(symbol: string, side: BinanceEnum = BinanceEnum.SIDE_SELL): NewOrder {
        const quantity = Number(this.accountManager.getInWallet(SymbolToTrade.BTC).free) / Number(this.transactions.ticker.bestAskPrice);
        return new NewOrder({
            symbol: symbol + SymbolToTrade.DEFAULT,
            type: BinanceEnum.ORDER_TYPE_MARKET,
            side: side,
            quantity: Number(quantity.toPrecision(8)),
            timestamp: Date.now()
        });
    }

    public resetOrderWithMarketPrice(wallet: Wallet, side: BinanceEnum = BinanceEnum.SIDE_SELL): NewOrder {
        return new NewOrder({
            symbol: wallet.asset,
            type: BinanceEnum.ORDER_TYPE_MARKET,
            side: side,
            quantity: Number(wallet.free),
            timestamp: Date.now()
        });
    }

    public setCurrentOrders(currentOrders: Order[]) {
        this.currentOrders = currentOrders;
    }

    public getCurrentOrders(): Order[] {
        return this.currentOrders;
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
        this.logger.details('Sending order: ', newOrder);
        this.binanceRest.newOrder(newOrder.getParameters(), (response) => {
            this.logger.details('response in callback after sending a new order', response);
        });
    }

    private cancelOrder(order: Order): Promise<any> {
        return new Promise((resolve, reject): any => {
            this.binanceRest.cancelOrder({
                symbol: order.symbol,
                timestamp: order.time
            }, (response) => {
                this.logger.details('response in callback after cancelling an order', response);
                resolve();
            })
            .then((response) => {
                this.logger.details('response in then after cancelling an order', response);
                resolve();
            })
            .catch((error) => {
                this.logger.details('error while trying to cancel an order', error);
                reject();
            });
        });
    }

    public getCurrentOrdersFromBinance(): Promise<any> {
        return new Promise((resolve, reject): any => {
            this.binanceRest.openOrders()
            .then((dataOrders: Order[]) => {
                this.setCurrentOrders(dataOrders);
                this.logger.details('Retrieved open orders informations from Binance', this.getCurrentOrders());
                resolve();
            })
            .catch((error) => {
                console.log('Error while retriving open orders from Binance', error);
            });
        });
    }
}
