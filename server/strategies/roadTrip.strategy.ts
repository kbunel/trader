import Strategy from './strategy';
import { CoinMarketCapModel } from './../models/coinmarketcap.model';
import { Promise } from 'es6-promise';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import { Wallet } from '../models/wallet.model';
import { Order } from '../models/order.model';
import { NewOrder } from '../models/newOrder.model';
import { BinanceEnum } from '../enums/binance.enum';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';

export default class RoadTripStrategy extends Strategy {

  public strategyName = 'Road Trip Strategy';

  private orderSent: Boolean;

  public launch(): any {
    return new Promise((resolve): any => {
      if (!this.informationsRequired()) {
        console.log('Missing informations to continue');
        resolve();
      }
      resolve();

      // const best1HrPercent: CoinMarketCapModel = this.getBest(this.coinMarketCapTools.P_1H);
      // this.logger.log('Best current crypto is: ', best1HrPercent);

      // if (this.transactions.symbol !== best1HrPercent.symbol + SymbolToTrade.DEFAULT) {
      //   this.logger.log('Transactions not watching the good crypto, Let\'s watch it');

      //   this.transactions.symbol = best1HrPercent.symbol + SymbolToTrade.DEFAULT;
      //   this.transactions.socket();

      //   resolve();
      // } else if (this.accountManager.getInWallet(best1HrPercent.symbol)
      //     && this.isCurrentCrypto(best1HrPercent.symbol)) {
      //   this.logger.log('We got ' + best1HrPercent.symbol + ', let\'s keep for now');

      //   resolve();
      // } else if (this.orderManager.getCurrentOrder(best1HrPercent.symbol).length) {
      //   this.logger.log('Best 1Hr Percent found in current order, let\'s check if it s still available');

      //   this.orderManager.resetOrdersIfTooLong(5);
      //   resolve();
      // } else if (this.orderManager.getCurrentOrders().length) {
      //   this.logger.log('Crypto ' + best1HrPercent.symbol + ' not in wallet and not in current orders'
      //   + ' but orders found, let\'s cancel them all to buy the good crypto');

      //   this.orderManager.cancelAllOrders();
      // } else {
      //   this.logger.log('Crypto ' + best1HrPercent.symbol + ' not in wallet and not in current orders,'
      //   + ' no order running, let\'s buy some');

      //   this.orderManager.sellEverything();
      //   // this.sendNewOrderWithBestRate(best1HrPercent);
      // }

      // this.logger.log('EOS');
    });
  }

  private sendNewOrderWithBestRate(best1HrPercent: CoinMarketCapModel): void {
    const newOrder = this.orderManager.createNewOrderFromSymbol(best1HrPercent.symbol, BinanceEnum.SIDE_BUY);
    this.orderManager.sendNewOrder(newOrder);
      // .then(() => {
      //   this.logger.log('An order to get ' + best1HrPercent.symbol + ' has been sent');
      //   this.orderManager.getCurrentOrdersFromBinance();
      // })
      // .catch((error) => {
      //   this.logger.error('Error while trying to send order to get ' + best1HrPercent.symbol, error);
      //   this.orderManager.getCurrentOrdersFromBinance();
      // });
  }

  private getBest(key: string): CoinMarketCapModel {
    this.logger.log('Looking for the best Crypto with highest ' + key);
    const selection = this.getAvailablesCoins();

    return selection.sort((a: CoinMarketCapModel, b: CoinMarketCapModel) => {
      return Number(b[key]) - Number(a[key]);
    })[0];
  }

  private getAvailablesCoins(): CoinMarketCapModel[] {
    const selected: CoinMarketCapModel[] = [];
    for (const c of this.transactions.coinmarketcap) {
      for (const t of this.transactions.allTickers) {
        if (c['symbol'] + 'ETH' === t['symbol'] || c['symbol'] + 'BTC' === t['symbol']) {
          selected.push(c);
          break;
        }
      }
    }
    return selected;
  }

  private isCurrentCrypto(symbol: string): boolean {
    this.logger.log('Checkin if ' + symbol + ' is the crypto with the highest value in the wallet');

    return this.accountManager.getHigherPriceInWallet().asset === symbol;
  }

  private informationsRequired(): boolean {
    return !(!this.transactions.allTickers
            || !this.accountManager.getAccount()
            || !this.orderManager.getExchangeInfo());
  }
}
