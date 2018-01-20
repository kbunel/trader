import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import Strategie from './strategy';
import RoadTripStrategy from './roadTrip.strategy';
import FlickFlackStrategy from './flickFlack.strategy';

export default class StrategyManager {

  private strategyConfig: StrategyConfig;

  constructor(strategyConfig: StrategyConfig) {
    this.strategyConfig = strategyConfig;
  }

  public execute(strategy: string): Promise<void> {
    let currentStrategy: any;
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
