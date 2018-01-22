import { CoinMarketCapModel } from '../models/coinmarketcap.model';
import Transactions from '../transactions';

export default class CoinMarketCapTools {

  readonly P_1H  = 'percent_change_1h';
  readonly P_24H = 'percent_change_24h';
  readonly P_7D  = 'percent_change_7d';

  private transactions: Transactions;

  constructor(transactions: Transactions) {
    this.transactions = transactions;
  }

  public getBest(key: string): CoinMarketCapModel {
    return this.transactions.coinmarketcap.sort((a: CoinMarketCapModel, b: CoinMarketCapModel) => {
      return Number(b[key]) - Number(a[key]);
    })[0];
  }
}
