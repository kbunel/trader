import Transactions from '../transactions';
import { FrontModel } from '../models/front.model';
import Indicators from '../indicators';
import Logger from '../Logger';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import { Account } from '../models/account.model';

export interface StrategyConfig {
  transactions: Transactions;
  front: FrontModel;
  indicators: Indicators;
  logger: Logger;
  coinMarketCapTools: CoinMarketCapTools;
  account: Account;
}
