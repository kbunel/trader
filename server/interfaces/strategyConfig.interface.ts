import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';

export interface StrategyConfig {
  transactions: Transactions;
  front: FrontModel;
  indicators: Indicators;
}
