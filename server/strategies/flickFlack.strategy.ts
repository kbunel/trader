import Strategy from './strategy';
import { BinanceEnum } from '../enum';
import { Promise } from 'es6-promise';

export default class FlickFlackStrategy extends Strategy {

  private priceCurrent: number = null;
  private action: string = BinanceEnum.SIDE_SELL;

  public launch(): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (!this.priceCurrent) {
        this.priceCurrent = Number(this.transactions.trade.price);
      }

      this.transactions.haveOrder()
        .then((status: boolean) => {
          if (!status && this.indicators.validateOrder(this.priceCurrent, Number(this.transactions.trade.price), this.action)) {
            const price: number = this.indicators.price();

            this.transactions.sendOrder(this.action, price)
              .then(() => {
                this.priceCurrent = price;
                this.action = this.action === BinanceEnum.SIDE_SELL ? BinanceEnum.SIDE_BUY : BinanceEnum.SIDE_SELL;

                resolve();
              })
              .catch(reject);
          } else {
            resolve();
          }
        })
        .catch(reject);
    });
  }
}
