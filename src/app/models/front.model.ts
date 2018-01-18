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
  public haveOrder: boolean = null;
  public lastOrder: OrderModel = null;
  public statusBot: boolean = null;
}
