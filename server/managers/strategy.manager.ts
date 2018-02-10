import { StrategyConfig } from './../interfaces/strategyConfig.interface';
import Strategie from '../strategies/strategy';
import RoadTripStrategy from '../strategies/roadTrip.strategy';
import FlickFlackStrategy from '../strategies/flickFlack.strategy';
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

    switch (strategy) {
      case 'roadTrip':
        currentStrategy = new RoadTripStrategy(this.strategyConfig);
        break;
      case 'flickFlack':
        currentStrategy = new FlickFlackStrategy(this.strategyConfig);
        break;
      default:
        this.logger.log('Ivalid strategy');
        return null;
    }
    return currentStrategy.launch();
  }

}
