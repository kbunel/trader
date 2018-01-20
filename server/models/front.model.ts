export class OrderModel {
  public symbol: string = null;
  public type: string = null;
  public timeInForce: string = null;
  public timestamp: number = null;
  public quantity: number = null;
  public price: number = null;
  public side: string = null;
}

export class FrontModel {
  public symbol: string = null;
  public interval: string = null;
  public haveOrder: boolean = false;
  public lastOrder: OrderModel = null;
  public statusBot: boolean = false;
  public startServerTime: number = null;
  public startBotTime: number = null;
  public stopBotTime: number = null;
  public executeBotTime: number = null;
  public coinmarketcapTime: number = null;
  public priceOrder: number = null;
}
