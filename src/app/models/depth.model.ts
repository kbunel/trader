// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#diff-depth-stream

export class depthDelta {
  public ignored: Array<string | [any]> = [];
  public price: string = null;
  public quantity: string = null;
}

export class DepthModel {
  public askDepthDelta: depthDelta[] = [];
  public bidDepthDelta: depthDelta[] = [];
  public eventTime: number = null;
  public eventType: string = null;
  public firstUpdateId: number = null;
  public lastUpdateId: number = null;
  public symbol: string = null;
}
