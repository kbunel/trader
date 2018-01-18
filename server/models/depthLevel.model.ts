// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#partial-book-depth-streams

export class DepthLevelModel {
  public asks: Array<string | [any]> = [];
  public bids: Array<string | [any]> = [];
  public lastUpdateId: number = null;
}
