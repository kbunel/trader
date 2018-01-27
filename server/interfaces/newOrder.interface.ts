import { BinanceEnum } from '../enums/binance.enum';

export interface NewOrderInterface {
    symbol: string;
    side: BinanceEnum;
    type: BinanceEnum;
    quantity: number;
    timestamp: number;
}
