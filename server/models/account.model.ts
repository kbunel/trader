import { Wallet } from './wallet.models';

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

  public getWallet(): Wallet[] {
    const wallet = [];
      for (const balance of this.balances) {
        if (Number(balance.free) > 0 || Number(balance.locked) > 0) {
          wallet.push(balance);
        }
      }
      return wallet;
  }
}
