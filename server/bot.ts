import 'dotenv/config';
import * as api from 'binance';
import { Promise } from 'es6-promise';
import { FrontModel } from './models/front.model';
import Transactions from './transactions';
import Indicators from './indicators';
import StrategyManager from './managers/strategy.manager';
import { StrategyConfig } from './interfaces/strategyConfig.interface';
import Logger from './logger';
import CoinMarketCapTools from './tools/coinMarketCap.tools';
import { Account } from './models/account.model';
import AccountManager from './managers/account.manager';
import { Order } from './models/order.model';
import { BinanceEnum } from './enums/binance.enum';
import OrderManager from './managers/order.manager';
import { setTimeout } from 'timers';

export default class Bot {

  private active: boolean = process.env.AUTO_START_BOT;

  private strategyManager: StrategyManager;
  private indicators: Indicators = null;
  private transactions: Transactions;
  private front: FrontModel;
  private logger: Logger;
  private coinMarketCapTools: CoinMarketCapTools;
  private binanceRest: any;
  private accountManager: AccountManager;

  /**
   *
   * @param server
   */
  constructor(server) {
    this.logger = new Logger();
    this.logger.log('Starting BOT');

    console.log(this.active);

    this.binanceRest = new api.BinanceRest({
      key: String(process.env.APIKEY),
      secret: String(process.env.APISECRET),
    });

    this.front = new FrontModel();
    this.indicators = new Indicators(this.front);
    this.transactions = new Transactions(server, this.front, this.binanceRest);
    this.coinMarketCapTools = new CoinMarketCapTools(this.transactions);
    this.accountManager = new AccountManager(this.binanceRest, this.transactions);
    this.strategyManager = new StrategyManager(this.initStrategyConfig());

    this.execute();
  }

  /**
   *
   */
  private execute(): void {
    if (process.env.LOOP_TIME <= 0) {
      return;
    }
    this.front.statusBot = this.active;
    this.front.executeBotTime = Date.now();
    this.transactions.sendDataFront();

    if (process.env.SHOW_MARKET_DATA === 'true') {
      setTimeout(() => {
        // this.logger.log('Agg Trade', this.transactions.aggTrade);
        // this.logger.log('Kline', this.transactions.kline);
        // this.logger.log('All Klines', this.transactions.allKlines);
        // this.logger.log('Ticker', this.transactions.ticker);
        // this.logger.log('All Tickers', this.transactions.allTickers);
        // this.logger.log('Depth', this.transactions.depth);
        // this.logger.log('Depth Level', this.transactions.depthLevel);
        // this.logger.log('Trade', this.transactions.trade);
        // this.logger.log('User Data', this.transactions.userData);
      }, process.env.LOOP_TIME);
    }

    if (!this.active) {
      return this.execute();
    }

    this.strategyManager.execute(process.env.STRATEGY)
    .then(() => (process.env.LOOP_ACTIVE === 'true') ?
      setTimeout(() => this.execute(), process.env.LOOP_TIME) : null )
    .catch(() => (process.env.LOOP_ACTIVE === 'true') ?
      setTimeout(() => this.execute(), process.env.LOOP_TIME) : null );
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
      orderManager: new OrderManager(this.binanceRest, this.accountManager, this.transactions)
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
