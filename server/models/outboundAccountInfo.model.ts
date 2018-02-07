// https://github.com/aarongarvey/binance#onuserdatabinancerest-eventhandler-interval

export class OutboundAccountInfo {
    public eventType: string;
    public eventTime: number;
    public makerCommission: number;
    public takerCommission: number;
    public buyerCommission: number;
    public sellerCommission: number;
    public canTrade: boolean;
    public canWithdraw: boolean;
    public canDeposit: boolean;
    public lastUpdateTime: number;
    public balances: OutboundBalances[];
}

export class OutboundBalances {
    public asset: string;
    public availableBalance: string;
    public onOrderBalance: string;
}