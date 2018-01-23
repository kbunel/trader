import Strategy from './strategy';
import { CoinMarketCapModel } from './../models/coinmarketcap.model';
import { Promise } from 'es6-promise';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import { Wallet } from '../models/wallet.models';

export default class RoadTripStrategy extends Strategy {

  public strategyName = 'Road Trip Strategy';
  private wallet: Wallet[];

  public launch(): any {
    return new Promise((resolve): any => {
      if (!this.transactions.allTickers) {
        resolve();
        return;
      }
      const best1HrPercent: CoinMarketCapModel = this.getBest(this.coinMarketCapTools.P_1H);
      //this.logger.log('best 1hr', best1HrPercent);

      this.transactions.getWallet()
      .then((response) => {
        this.wallet = response;
        this.logger.log('Wallet =>', this.wallet);
        if (!this.walletContains(best1HrPercent)) {
          // Go buy it !!!!!
          console.log('**************************');
          console.log('Change money required');
          console.log(best1HrPercent);
          console.log('**************************');
        } else {
          console.log('Wallet is OK');
        }
      });

      resolve();
    });
  }

  private walletContains(coin: CoinMarketCapModel): boolean {
    for (const w of this.wallet) {
      if (w['asset'] === coin['symbol'] && this.isBestAmountInWallet(w)) {
        return true;
      }
    }
    return false;
  }

  private isBestAmountInWallet(coin: Wallet): boolean {
    for (const w of this.wallet) {
      if (w['asset'] != coin['asset'] && Number(w['free']) > Number(coin['free'])) {
        return false;
      }
    }
    return true;
  }

  private getBest(key: string): CoinMarketCapModel {
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
}
