import 'dotenv/config';
import * as api from 'binance';
import { Promise } from 'es6-promise';
import { FrontModel } from './models/front.model';
import Transactions from './transactions';
import Indicators from './indicators';
import StrategyManager from './strategies/strategyManager';
import { StrategyConfig } from './interfaces/strategyConfig.interface';
import Logger from './logger';
import CoinMarketCapTools from './tools/coinMarketCap.tools';
import { Account } from './models/account.model';
import AccountManager from './accountManager';
import { Order } from './models/order.model';
import { BinanceEnum } from './binanceEnum';
import OrderManager from './orderManager';

export default class Bot {

  private active: boolean = process.env.AUTO_START_BOT;

  private strategyManager: StrategyManager;
  private indicators: Indicators = null;
  private transactions: Transactions;
  private front: FrontModel;
  private logger: Logger;
  private coinMarketCapTools: CoinMarketCapTools;
  private orders: Order[] = [];
  private binanceRest: any;
  private accountManager: AccountManager;

  /**
   *
   * @param server
   */
  constructor(server) {
    this.logger = new Logger();
    this.logger.log('Starting BOT');

    this.binanceRest = new api.BinanceRest({
      key: String(process.env.APIKEY),
      secret: String(process.env.APISECRET),
    });

    this.front = new FrontModel();
    this.indicators = new Indicators(this.front);
    this.transactions = new Transactions(server, this.front, this.binanceRest);
    this.coinMarketCapTools = new CoinMarketCapTools(this.transactions);
    this.accountManager = new AccountManager(this.binanceRest);
    this.strategyManager = new StrategyManager(this.initStrategyConfig());

    this.execute();
  }

  /**
   *
   */
  private execute(): void {
    this.front.statusBot = this.active;
    this.front.executeBotTime = Date.now();
    this.transactions.sendDataFront();

    if (!this.active) {
      return this.execute();
    }

    this.strategyManager.execute(process.env.STRATEGY)
    .then(() => (process.env.LOOP_ACTIVE === 'true') ? setTimeout(() => this.execute(), 3000) : null )
    .catch(() => (process.env.LOOP_ACTIVE === 'true') ? setTimeout(() => this.execute(), 3000) : null );
  }

  /**
   *
   * @returns {StrategyConfig}
   */
  private initStrategyConfig(): StrategyConfig {
    return {
      transactions: this.transactions,
      front: this.front,
      indicators: this.indicators,
      logger: this.logger,
      coinMarketCapTools: this.coinMarketCapTools,
      accountManager: this.accountManager,
      orderManager: new OrderManager(this.orders, this.binanceRest, this.accountManager)
    };
  }

  /**
   *
   */
  public start(): void {
    this.active = true;

    this.front.startBotTime = Date.now();
    this.front.stopBotTime = null;
  }

  /**
   *
   */
  public stop(): void {
    this.active = false;

    this.front.stopBotTime = Date.now();
    this.front.startBotTime = null;
  }
}
