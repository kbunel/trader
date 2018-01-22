import 'dotenv/config';
import { FrontModel } from './models/front.model';
import Transactions from './transactions';
import Indicators from './indicators';
import StrategyManager from './strategies/strategyManager';
import { StrategyConfig } from './interfaces/strategyConfig.interface';
import Logger from './logger';
import CoinMarketCapTools from './tools/coinMarketCap.tools';

export default class Bot {

  private active: boolean = process.env.AUTO_START_BOT;

  private strategyManager: StrategyManager;
  private indicators: Indicators = null;
  private transactions: Transactions;
  private front: FrontModel;
  private logger: Logger;
  private coinMarketCapTools: CoinMarketCapTools;
  private account: Account;

  /**
   *
   * @param server
   */
  constructor(server) {
    this.front = new FrontModel();
    this.logger = new Logger();
    this.indicators = new Indicators(this.front);
    this.transactions = new Transactions(server, this.front);
    this.coinMarketCapTools = new CoinMarketCapTools(this.transactions);
    this.strategyManager = new StrategyManager(this.initStrategyConfig());

    this.front.startServerTime = Date.now();

    this.init()
    .then(() => {
      this.logger.log('Initialization done');
      this.loop();
    });
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

  /**
   *
   */
  private execute(): void {
    this.front.statusBot = this.active;
    this.front.executeBotTime = Date.now();

    if (!this.active) {
      return this.loop();
    }

    this.strategyManager.execute(process.env.STRATEGY)
    .then(() => (process.env.LOOP_ACTIVE === 'true') ? this.loop() : null )
    .catch(() => (process.env.LOOP_ACTIVE === 'true') ? this.loop() : null );
  }

  /**
   *
   */
  private loop(): void {
    this.transactions.sendDataFront();
    // this.logger.log(this);

    setTimeout(() => this.execute(), 1000);
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
      account: this.account
    };
  }

  private init(): Promise<any[]> {
      const promises = [
        this.transactions.binanceRest.account()
        .then((data) => {
          this.logger.log('Data user updated', data);
          this.account = data;
        })
      ];

      return Promise.all(promises);
  }
}
