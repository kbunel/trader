import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';
import Logger from '../logger';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import AccountManager from '../managers/account.manager';
import { Order } from '../models/order.model';
import OrderManager from '../managers/order.manager';
import SocketManager from '../managers/socket.manager';
import Trader from '../tools/trader.service';

export interface StrategyConfig {
  trader: Trader;
  transactions: Transactions;
  front: FrontModel;
  indicators: Indicators;
  logger: Logger;
  coinMarketCapTools: CoinMarketCapTools;
  orderManager: OrderManager;
  accountManager: AccountManager;
  socketManager: SocketManager;
}
