import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import Strategie from '../strategies/strategy';
import RoadTripStrategy from '../strategies/roadTrip.strategy';
import FlickFlackStrategy from '../strategies/flickFlack.strategy';
import Logger from '../Logger';
import Strategy from '../strategies/strategy';

export default class StrategyManager {

  private strategyConfig: StrategyConfig;
  private logger: Logger;
  private currentStrategy: Strategy;

  constructor(strategyConfig: StrategyConfig, strategy: string) {
    this.strategyConfig = strategyConfig;
    this.logger = strategyConfig.logger;
    this.initStrategy(strategy);
  }

  public execute(): Promise<void> {
    return this.currentStrategy.launch();
  }

  private initStrategy(strategy): void {
    switch (strategy) {
      case 'roadTrip':
      this.currentStrategy = new RoadTripStrategy(this.strategyConfig);
      break;
      case 'flickFlack':
      this.currentStrategy = new FlickFlackStrategy(this.strategyConfig);
      break;
      default:
      this.logger.log('Invalid strategy');
      return null;
    }
  }
}
