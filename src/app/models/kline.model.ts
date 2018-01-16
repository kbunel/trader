// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#klinecandlestick-streams
// m -> minutes; h -> hours; d -> days; w -> weeks; M -> months
// 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w

export class Kline {
  public close: string = null;
  public endTime: number = null;
  public final: boolean = null;
  public firstTradeId: number = null;
  public high: string = null;
  public ignored: string = null;
  public interval: string = null;
  public lastTradeId: number = null;
  public low: string = null;
  public open: string = null;
  public quoteVolume: string = null;
  public quoteVolumeActive: string = null;
  public startTime: number = null;
  public symbol: string = null;
  public trades: number = null;
  public volume: string = null;
  public volumeActive: string = null;
}

export class KlineModel {
  public eventTime: number = null;
  public eventType: string = null;
  public kline: Kline;
  public symbol: string = null;
}
