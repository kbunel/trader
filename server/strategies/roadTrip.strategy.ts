import Strategy from './strategy';
import { CoinMarketCapModel } from './../models/coinmarketcap.model';
import { Promise } from 'es6-promise';

export default class RoadTripStrategy extends Strategy {

  public launch(): Promise<void> {
    return new Promise((resolve): any => {
      const best: CoinMarketCapModel = this.getBestPercent();
      console.log(best);
      resolve();
    });
  }

  private getBestPercent(): CoinMarketCapModel {
    let best: CoinMarketCapModel = this.transactions.coinmarketcap[0];
    for (const c of this.transactions.coinmarketcap) {
      if (best.percent_change_24h > c.percent_change_24h) {
        best = c;
      }
    }
    return best;
  }
}
