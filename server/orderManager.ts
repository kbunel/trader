import { Promise } from 'es6-promise';
import { Wallet } from './models/wallet.model';
import { NewOrder } from './models/newOrder.model';
import { BinanceEnum } from './binanceEnum';
import { Order } from './models/order.model';
import Logger from './Logger';
import AccountManager from './accountManager';
import BinanceRest from 'binance';

export default class OrderManager {
    private orders: Order[];
    private logger: Logger;
    private account: Account;
    private binanceRest: BinanceRest;

    constructor(orders: Order[], binanceRest: BinanceRest, accountManager: AccountManager) {
        this.setOrders(orders);
        this.binanceRest = binanceRest;
        this.logger = new Logger();

        this.getOrdersFromBinance();
    }

    public treatCurrentOrders() {
        if (this.getOrders().length) {
            this.logger.details('Open orders found, checking orders', this.orders);
            this.checkOrders();
        } else {
          this.logger.log('No open orders');
        }
    }

    public getNewOrderFromWallet(wallet: Wallet): NewOrder {
        return new NewOrder({
            symbol: wallet.asset,
            type: BinanceEnum.ORDER_TYPE_MARKET,
            side: BinanceEnum.SIDE_BUY,
            quantity: Number(wallet.free),
            timestamp: Date.now()
        });
    }

    public setOrders(orders: Order[]) {
        this.orders = orders;
    }

    public getOrders(): Order[] {
        return this.orders;
    }

    private checkOrders(): void {
        this.logger.log('Checking orders');
        for (const order of this.orders) {
            // give 5 minutes to the order to be sold
            if (Number(order.time) + 5 * 60 * 1000 < Date.now()) {

                this.logger.log('Order #' + order.orderId + 'for ' + order.symbol +
                ' is pending since more than 5 minutes cancelling and putting it back to the market value');

                this.cancelOrder(order)
                .then(() => {
                    // this.newOrder(this.account.)
                });
            }
        }
    }

    private newOrder(newOrder: NewOrder): Promise<any> {
        return new Promise((resolve, reject) => {
            this.binanceRest.newOrder(newOrder.getParameters(), (response) => {
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

    private getOrdersFromBinance(): Promise<any> {
        return new Promise((resolve, reject): any => {
            this.binanceRest.openOrders()
            .then((dataOrders: Order[]) => {
                this.orders = dataOrders;
                this.logger.details('Retrieved open orders informations', this.orders);
                resolve();
            })
            .catch((error) => {
                console.log('Error while retriving open orders', error);
            });
        });
    }
}
