import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';
import Logger from '../Logger';

export interface StrategyConfig {
  transactions: Transactions;
  front: FrontModel;
  indicators: Indicators;
  logger: Logger;
}
