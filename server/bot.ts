import 'dotenv/config';
import { FrontModel } from './models/front.model';
import Transactions from './transactions';
import Indicators from './indicators';
import StrategyManager from './strategies/strategyManager';
import { StrategyConfig } from './interfaces/strategyConfig.interface';

export default class Bot {

  private active: boolean = process.env.AUTO_START_BOT;

  private strategyManager: StrategyManager;
  private indicators: Indicators = null;
  private transactions: Transactions;
  private front: FrontModel;

  /**
   *
   * @param server
   */
  constructor(server) {
    this.front = new FrontModel();
    this.indicators = new Indicators();
    this.transactions = new Transactions(server, this.front);
    this.strategyManager = new StrategyManager(this.initStrategyConfig());

    this.loop();
  }

  /**
   *
   */
  public start(): void {
    this.active = true;
  }

  /**
   *
   */
  public stop(): void {
    this.active = false;
  }

  /**
   *
   */
  private execute(strategie?: string): void {
    this.front.statusBot = this.active;

    if (!this.active) {
      return this.loop();
    }

    this.strategyManager.execute(process.env.strategy)
      .then(() => this.loop())
      .catch(() => this.loop());
  }

  /**
   *
   */
  private loop(): void {
    this.transactions.sendDataFront();
    setTimeout(() => this.execute(process.env.strategie), 1000);
  }

  /**
   *
   * @returns {StrategyConfig}
   */
  private initStrategyConfig(): StrategyConfig {
    return {
      transactions: this.transactions,
      front: this.front,
      indicators: this.indicators
    };
  }
}
