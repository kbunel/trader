import Strategy from './strategy';
import { CoinMarketCapModel } from './../models/coinmarketcap.model';
import { Promise } from 'es6-promise';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';

export default class RoadTripStrategy extends Strategy {

  public strategyName = 'Road Trip Strategy';

  public launch(): any {
    return new Promise((resolve): any => {
      const best24HrPercent: CoinMarketCapModel = this.coinMarketCapTools.getBest(this.coinMarketCapTools.P_24H);
      this.logger.log('best 24hr', best24HrPercent);

      console.log('allTickers', this.transactions.allTickers);
      // console.log('kevinbunel', this.transactions);
      const wallet = this.transactions.getWallet()
      .then((response) => {
        this.logger.log('Wallet =>', response);
      });

      resolve();
    });
  }
}
