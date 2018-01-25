import { Wallet } from './models/wallet.model';
import { NewOrder } from './models/newOrder.model';
import { BinanceEnum } from './binanceEnum';
import { Order } from './models/order.model';
import Logger from './Logger';
import Transactions from './transactions';
import AccountManager from './accountManager';

export default class OrderManager {
    private orders: Order[];
    private logger: Logger;
    private transactions;
    private account: Account;

    constructor(orders: Order[], transactions: Transactions, accountManager: AccountManager) {
        this.setOrders(orders);
        this.transactions = transactions;
        this.logger = new Logger();
    }

    public treatCurrentOrders() {
        if (this.getOrders().length) {
            this.logger.log('Open orders found, checking orders', this.orders);
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
            this.transactions.binanceRest.newOrder(newOrder.getParameters(), () => {
            resolve();
            console.log('response in callback after cancelling an order');
          })
          .then((response) => {
              resolve();
              console.log('response in then after cancelling an order');
            })
            .catch((error) => {
                reject();
                console.log('error while trying to cancel an order', error);
            });
        });
    }

    private cancelOrder(order: Order): Promise<any> {
        return new Promise((resolve, reject): any => {
            this.transactions.binanceRest.cancelOrder({
                symbol: order.symbol,
                timestamp: order.time
            }, (response) => {
                resolve();
                console.log('response in callback after cancelling an order');
            })
            .then((response) => {
                resolve();
                console.log('response in then after cancelling an order');
            })
            .catch((error) => {
                reject();
                console.log('error while trying to cancel an order', error);
            });
        });
    }
}
