import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import Strategie from './strategy';
import RoadTripStrategy from './roadTrip.strategy';
import FlickFlackStrategy from './flickFlack.strategy';
import Logger from '../Logger';

export default class StrategyManager {

  private strategyConfig: StrategyConfig;
  private logger: Logger;

  constructor(strategyConfig: StrategyConfig) {
    this.strategyConfig = strategyConfig;
    this.logger = strategyConfig.logger;
  }

  public execute(strategy: string): Promise<void> {
    let currentStrategy: any;

    this.logger.log('strategie: ', strategy);
    switch (strategy) {
      case 'getBestPercentChange':
        currentStrategy = new RoadTripStrategy(this.strategyConfig);
        break;
      default:
        currentStrategy = new FlickFlackStrategy(this.strategyConfig);
        break;
    }
    return currentStrategy.launch();
  }

}
