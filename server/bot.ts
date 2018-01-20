import 'dotenv/config';
import { FrontModel } from './models/front.model';
import Transactions from './transactions';
import Indicators from './indicators';
import StrategyManager from './strategies/strategyManager';
import { StrategyConfig } from './interfaces/strategyConfig.interface';
import Logger from './logger';

export default class Bot {

  private active: boolean = process.env.AUTO_START_BOT;

  private strategyManager: StrategyManager;
  private indicators: Indicators = null;
  private transactions: Transactions;
  private front: FrontModel;
  private logger: Logger;

  /**
   *
   * @param server
   */
  constructor(server) {
    this.front = new FrontModel();
    this.indicators = new Indicators(this.front);
    this.transactions = new Transactions(server, this.front);
    this.logger = new Logger();
    this.strategyManager = new StrategyManager(this.initStrategyConfig());

    this.front.startServerTime = Date.now();

    this.loop();
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
      logger: this.logger
    };
  }
}
