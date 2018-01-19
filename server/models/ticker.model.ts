// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#individual-symbol-ticker-streams

export class TickerModel {
  public baseAssetVolume: string = null;
  public bestAskPrice: string = null;
  public bestAskQuantity: string = null;
  public bestBid: string = null;
  public bestBidQuantity: string = null;
  public closeQuantity: string = null;
  public closeTime: number = null;
  public currentClose: string = null;
  public eventTime: number = null;
  public eventType: string = null;
  public firstTradeId: number = null;
  public high: string = null;
  public lastTradeId: number = null;
  public low: string = null;
  public open: string = null;
  public openTime: number = null;
  public previousClose: string = null;
  public priceChange: string = null;
  public priceChangePercent: string = null;
  public quoteAssetVolume: string = null;
  public symbol: string = null;
  public trades: number = null;
  public weightedAveragePrice: string = null;
}
