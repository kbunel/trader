import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import { StrategyInterface } from './../interfaces/strategy.interface';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import { FrontModel } from '../models/front.model';
import { Account } from '../models/account.model';
import Transactions from '../transactions';
import Indicators from '../indicators';
import Logger from '../Logger';

export default abstract class Strategy implements StrategyInterface {

  protected transactions: Transactions;
  protected front: FrontModel;
  protected indicators: Indicators;
  protected logger: Logger;
  protected coinMarketCapTools: CoinMarketCapTools;
  protected account: Account;

  public abstract strategyName;

  constructor(strategyConfig: StrategyConfig) {
    this.transactions = strategyConfig.transactions;
    this.indicators = strategyConfig.indicators;
    this.front = strategyConfig.front;
    this.logger = strategyConfig.logger;
    this.coinMarketCapTools = strategyConfig.coinMarketCapTools;
    this.account = strategyConfig.account;
  }

  abstract launch(): Promise<void>;
}
