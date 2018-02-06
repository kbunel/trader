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
        return;
      }

      if (process.env.SHOW_MARKET_DATA === 'true') {
        this.socketManager.logDatas();
      }

      // this.orderManager.getCurrentOrdersFromBinance();

      const best1HrPercent: CoinMarketCapModel = this.getBest(this.coinMarketCapTools.P_1H);
      this.logger.log('Best current crypto (' + Number(best1HrPercent.percent_change_1h) + ') is: ', best1HrPercent);

      if (Number(best1HrPercent.percent_change_1h) < 0) {
        this.logger.log('Nothing currently interesting, let\'s not make any move');

        resolve();
        return;
      } else if (this.socketManager.getSymbolToWatch() !== best1HrPercent.symbol + SymbolToTrade.DEFAULT) {
        this.logger.log('Transactions not watching the good crypto, Let\'s watch it');

        this.socketManager.setSymbolToWatch(best1HrPercent.symbol);
        this.socketManager.resetCombinedSocket();

        resolve();
        return;
      } else if (this.accountManager.getInWallet(best1HrPercent.symbol)
          && this.isCurrentCrypto(best1HrPercent.symbol) && this.isWorthyToSwitch(best1HrPercent)) {
        this.logger.log('We got ' + best1HrPercent.symbol + ', let\'s keep for now');

        resolve();
        return;
      } else if (this.orderManager.getCurrentOrder(best1HrPercent.symbol).length) {
        this.logger.log('Best 1Hr Percent found in current order, let\'s check if it s still available');

        this.orderManager.resetOrdersIfTooLong(5);
        resolve();
        return;
      } else if (this.orderManager.getCurrentOrders().length) {
        this.logger.log('Crypto ' + best1HrPercent.symbol + ' not in wallet and not in current orders'
        + ' but orders found, let\'s cancel them all to buy the good crypto');

        this.orderManager.cancelAllOrders();
        resolve();
        return;
      } else {
        this.accountManager.getHigherValueInWallet()
        .then((wallet: Wallet) => {
          if (wallet.asset !== SymbolToTrade.DEFAULT) {
            this.logger.log('Crypto ' + best1HrPercent.symbol + ' not in wallet and not in current orders,'
            + ' let\' s get some ' + SymbolToTrade.DEFAULT + ' to buy it');

            this.orderManager.sellEverything(best1HrPercent.symbol);
            resolve();
            return;
          } else {
            this.logger.log('Let\'s buy some ' + best1HrPercent.symbol);

            this.orderManager.sendNewOrder(this.orderManager.createNewBuyOrder(best1HrPercent.symbol));
            resolve();
            return;
          }
        })
        .catch((error) => this.logger.error(error));
      }
    });
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
      for (const t of this.socketManager.getAllTickers()) {
        if (c['symbol'] + 'ETH' === t['symbol'] || c['symbol'] + 'BTC' === t['symbol']) {
          selected.push(c);
          break;
        }
      }
    }
    return selected;
  }

  private isCurrentCrypto(symbol: string): boolean {
    this.logger.log('Checking if ' + symbol + ' is the crypto with the highest value in the wallet');

    return this.accountManager.getHigherValueInWallet().asset === symbol;
  }

  private informationsRequired(): boolean {
    console.log('all ticker founds: ', this.socketManager.getAllTickers());
    if (!this.socketManager.getAllTickers()) {
      console.log('allTickers missing');
      return false;
    }

    if (!this.accountManager.getAccount()) {
      console.log('Account missing');
      return false;
    }

    if (!this.orderManager.getExchangeInfo()) {
      console.log('ExchangeInfo missing');
      return false;
    }
    return true;
  }

  private getCoinMarketCapValueFor(symbol: string): CoinMarketCapModel {
    this.logger.log('Looking for coinMarketCap value informations for ' + symbol);

    for (const c of this.transactions.coinmarketcap) {
      if (c.symbol === symbol) {
        return c;
      }
    }

    this.logger.error('CoinMarketCap informations for ' + symbol + ' not found...');
    return null;
  }

  private isWorthyToSwitch(symbolToSwitchFor: CoinMarketCapModel): boolean {
    this.logger.log('Checking if it is worthy to switch crypto place');

    const currentCrypto: CoinMarketCapModel = this.getCoinMarketCapValueFor(this.accountManager.getHigherValueInWallet().asset);

    if (Number(symbolToSwitchFor.percent_change_1h) > Number(currentCrypto.percent_change_1h) + 1) {
      this.logger.log('It is worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change_1h
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change_1h + ')');
      return true;
    } else {
      this.logger.log('Not worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change_1h
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change_1h + ')');
      return false;
    }
  }
}
