export interface StrategyInterface {
  strategyName: string;
  launch(): Promise<void>;
}
