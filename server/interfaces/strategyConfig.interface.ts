import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';
import Logger from '../Logger';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import AccountManager from '../managers/account.manager';
import { Order } from '../models/order.model';
import OrderManager from '../managers/order.manager';

export interface StrategyConfig {
  transactions: Transactions;
  front: FrontModel;
  indicators: Indicators;
  logger: Logger;
  coinMarketCapTools: CoinMarketCapTools;
  orderManager: OrderManager;
  accountManager: AccountManager;
}
