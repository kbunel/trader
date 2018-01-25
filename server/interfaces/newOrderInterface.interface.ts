import { BinanceEnum } from '../binanceEnum';

export interface NewOrderInterface {
    symbol: string;
    side: BinanceEnum;
    type: BinanceEnum;
    quantity: number;
    timestamp: number;
}
