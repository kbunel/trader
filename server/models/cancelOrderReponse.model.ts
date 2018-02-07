// https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#cancel-order-trade

export class CancelOrderResponse {
    public symbol: string;
    public origClientOrderId: string;
    public orderId: number;
    public clientOrderId: string;
  }
