// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#aggregate-trade-streams

export class AggTradeModel {
  public eventTime: number = null;
  public eventType: string = null;
  public firstTradeId: number = null;
  public ignored: number = null;
  public lastTradeId: number = null;
  public maker: number = null;
  public price: string = null;
  public quantity: string = null;
  public symbol: string = null;
  public time: number = null;
  public tradeId: number = null;
}
