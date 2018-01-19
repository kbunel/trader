import { CoinMarletCapModel } from '@models/coinmarketcap.model.ts';

export default class Strategies {

  private coinMarketCap: CoinMarletCapModel[] = [];

  public getBestPercentChange(): void {
    let best = this.getBestPercent();
  }

  public setCoinMarketCap(coinMarketCap: CoinMarletCapModel) {
    this.coinMarketCap = coinMarketCap;
  }

  private getBestPercent(): CoinMarletCapModel {
    let best: CoinMarletCapModel;

  }

}
