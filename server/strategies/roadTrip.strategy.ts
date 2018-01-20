import Strategy from './strategy';
import { CoinMarketCapModel } from './../models/coinmarketcap.model';
import { Promise } from 'es6-promise';

export default class RoadTripStrategy extends Strategy {

  public strategyName = 'Road Trip Strategy';

  public launch(): Promise<void> {
    return new Promise((resolve): any => {
      const best: CoinMarketCapModel = this.getBestPercent();
      this.logger.log(best);
      resolve();
    });
  }

  private getBestPercent(): CoinMarketCapModel {
    let best: CoinMarketCapModel = this.transactions.coinmarketcap[0];
    for (const c of this.transactions.coinmarketcap) {
      if (c.percent_change_24h[0] !== '-' && Number(best.percent_change_24h) > Number(c.percent_change_24h)) {
        best = c;
      }
    }
    return best;
  }
}
