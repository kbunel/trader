import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import { StrategyInterface } from './../interfaces/strategy.interface';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import { FrontModel } from '../models/front.model';
import { Order } from '../models/order.model';
import Transactions from '../transactions';
import Indicators from '../indicators';
import Logger from '../logger';
import OrderManager from '../managers/order.manager';
import AccountManager from '../managers/account.manager';
import SocketManager from '../managers/socket.manager';

export default abstract class Strategy implements StrategyInterface {

  protected transactions: Transactions;
  protected front: FrontModel;
  protected indicators: Indicators;
  protected logger: Logger;
  protected coinMarketCapTools: CoinMarketCapTools;
  protected orderManager: OrderManager;
  protected accountManager: AccountManager;
  protected socketManager: SocketManager;

  public abstract strategyName;

  constructor(strategyConfig: StrategyConfig) {
    this.transactions = strategyConfig.transactions;
    this.indicators = strategyConfig.indicators;
    this.front = strategyConfig.front;
    this.logger = strategyConfig.logger;
    this.coinMarketCapTools = strategyConfig.coinMarketCapTools;
    this.orderManager = strategyConfig.orderManager;
    this.accountManager = strategyConfig.accountManager;
    this.socketManager = strategyConfig.socketManager;
  }

  abstract launch(): Promise<void>;
}
