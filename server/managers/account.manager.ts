import { Account } from '../models/account.model';
import BinanceRest from 'binance';
import Logger from '../Logger';
import { Wallet } from '../models/wallet.model';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import Transactions from '../transactions';
import { CoinMarketCapModel } from '../models/coinmarketcap.model';

export default class AccountManager {
    private account: Account;
    private binanceRest: BinanceRest;
    private logger: Logger;
    private transactions: Transactions;

    constructor(binanceRest: BinanceRest, transactions: Transactions) {
        this.binanceRest = binanceRest;
        this.logger = new Logger();
        this.transactions = transactions;

        this.binanceRest.account()
        .then((data) => {
          this.setAccount(data);
          this.logger.details('Retrieved account informations');
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

    public getHigherPriceInWallet(symbolToTrade: SymbolToTrade = SymbolToTrade.DEFAULT): Wallet {
      let bestInWallet: Wallet = this.getWallet()[0];
      const wallet = this.getWallet();
      console.log('wallet', this.getWallet());
      for (const w of wallet) {
        console.log('checking', w);
        if (this.transactions.getFromCoinMarketCap(w.asset).price_btc > this.transactions.getFromCoinMarketCap(bestInWallet.asset).price_btc) {
          console.log(w, 'is better');
          bestInWallet = w;
        }
      }
      this.logger.log('Best crypto in the wallet is ' + bestInWallet.asset + ' with '
      + this.transactions.getFromCoinMarketCap(bestInWallet.asset).price_usd + ' $ available in the wallet');

      return bestInWallet;
    }
}
