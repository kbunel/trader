export class BestCoin {
    public symbol: string;
    public percent_change: number;
    public price: number;
    public variation: number;

    constructor(symbol: string = null, percent_change: number = null, price: number = null) {
        this.symbol = symbol;
        this.percent_change = percent_change;
        this.price = price;
    }
}

export enum CoinSource {
    binance = 'binance',
    coinmarketcap = 'coinmarketcap'
}
