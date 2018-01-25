import { Wallet } from './wallet.model';

export class Account {
  public makerCommission: Number;
  public takerCommission: Number;
  public buyerCommission: Number;
  public sellerCommission: Number;
  public canTrade: boolean;
  public canWithdraw: boolean;
  public canDeposit: boolean;
  public updateTime: Number;
  public balances: any[] = [];
}
