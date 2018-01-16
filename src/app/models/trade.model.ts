// https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#trade-streams

export class TradeModel {
  public buyerOrderId: number = null;
  public eventTime: number = null;
  public eventType: string = null;
  public ignored: number = null;
  public maker: number = null;
  public price: string = null;
  public quantity: string = null;
  public sellerOrderId: number = null;
  public symbol: string = null;
  public time: number = null;
  public tradeId: number = null;
}
