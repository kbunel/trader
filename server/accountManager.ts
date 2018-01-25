import { Account } from './models/account.model';
import BinanceRest from 'binance';
import Logger from './Logger';
import { Wallet } from './models/wallet.model';

export default class AccountManager {
    private account: Account;
    private binanceRest: BinanceRest;
    private logger: Logger;

    constructor(binanceRest: BinanceRest) {
        this.binanceRest = binanceRest;
        this.logger = new Logger();

        this.binanceRest.account()
        .then((data) => {
          this.logger.log('Retrieved account informations');
          this.setAccount(data);
        })
        .catch(console.error);
    }

    public setAccount(account: Account) {
        this.account = account;
    }

    public getAccount(): Account {
        return this.account;
    }

    public getWallet(): Wallet[] {
      const wallet = [];
        for (const balance of this.account.balances) {
          if (Number(balance.free) > 0 || Number(balance.locked) > 0) {
            wallet.push(balance);
          }
        }
        return wallet;
    }

    public getInWallet(symbol: string): Wallet {
      const wallet = this.getWallet();
      for (const w of wallet) {
        if (w.asset === symbol) {
          return w;
        }
      }
      return null;
    }
}
