import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';
import Logger from '../Logger';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import AccountManager from '../accountManager';
import { Order } from '../models/order.model';
import OrderManager from '../orderManager';

export interface StrategyConfig {
  transactions: Transactions;
  front: FrontModel;
  indicators: Indicators;
  logger: Logger;
  coinMarketCapTools: CoinMarketCapTools;
  orderManager: OrderManager;
  accountManager: AccountManager;
}
