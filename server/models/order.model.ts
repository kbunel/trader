// https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#current-open-orders-user_data

export class Order {
    public symbol: string;
    public orderId: number;
    public clientOrderId: string;
    public transactTime: number;
    public price: string;
    public origQty: string;
    public executedQty: string;
    public status: string;
    public timeInForce: string;
    public type: string;
    public side: string;
    public stopPrice: string;
    public icebergQty: string;
    public time: number;
    public isWorking: string;

    // From execution report
    public quantity: string;
    public executionType: string;

}
