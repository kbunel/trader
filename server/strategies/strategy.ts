import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import { StrategyInterface } from './../interfaces/strategy.interface';
import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';

export default abstract class Strategy implements StrategyInterface {

  protected transactions: Transactions;
  protected front: FrontModel;
  protected indicators: Indicators;

  constructor(strategyConfig: StrategyConfig) {
    this.transactions = strategyConfig.transactions;
    this.indicators = strategyConfig.indicators;
    this.front = strategyConfig.front;
  }

  abstract launch(): Promise<void>;

}
