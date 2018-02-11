export class BestCoin {
    public symbol: string;
    public percent_change: number;

    constructor(symbol: string = null, percent_change: number = null) {
        this.symbol = symbol;
        this.percent_change = percent_change;
    }
}

export enum CoinSource {
    binance = 'binance',
    coinmarketcap = 'coinmarketcap'
}
