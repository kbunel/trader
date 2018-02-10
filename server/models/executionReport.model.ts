// https://github.com/aarongarvey/binance#onuserdatabinancerest-eventhandler-interval
import { BinanceEnum } from '../enums/binance.enum';

export class ExecutionReport {
  public eventType: string;
  public eventTime: number;
  public symbol: string;
  public newClientOrderId: string;
  public side: BinanceEnum;
  public orderType: BinanceEnum;
  public cancelType: string;
  public quantity: string;
  public price: string;
  public stopPrice: string;
  public icebergQuantity: string;
  public g: number;
  public originalClientOrderId: string;
  public executionType: string;
  public orderStatus: BinanceEnum;
  public rejectReason: string;
  public orderId: number;
  public lastTradeQuantity: string;
  public accumulatedQuantity: string;
  public lastTradePrice: string;
  public commission: string;
  public commissionAsset: string;
  public tradeTime: number;
  public tradeId: number;
  public I: number;
  public w: boolean;
  public maker: boolean;
  public M: boolean;
  public O: number;
  public Z: string;
}
