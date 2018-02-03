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
      this.logger.log('Looking for ' + symbol + ' in wallet');
      const wallet = this.getWallet();
      for (const w of wallet) {
        if (w.asset === symbol) {
          this.logger.details(symbol + ' found in wallet', w);
          return w;
        }
      }
      this.logger.log(symbol + ' not found in wallet');
      return null;
    }

    public getHigherValueInWallet(): Wallet {
      this.logger.log('Looking for the highest crypto in the wallet');

      let bestInWallet: Wallet = this.getWallet()[2];
      const wallet = this.getWallet();

      for (const w of wallet) {
        if (this.getWalletPrice(w) > this.getWalletPrice(bestInWallet)) {
          bestInWallet = w;
        }
      }

      this.logger.details('Best crypto in the wallet is ' + bestInWallet.asset, bestInWallet);
      return bestInWallet;
    }

    public getWalletPrice(wallet: Wallet, ref: SymbolToTrade = SymbolToTrade.DEFAULT, price: string = 'best'): number {
      this.logger.log('Looking for the price of ' + wallet.asset + ' in ' + ref + '.');
      for (const ticker of this.transactions.allTickers) {
        if (wallet.asset + ref === ticker.symbol) {
          return Number(wallet.free) * Number((price === 'best') ? ticker.bestAskPrice : ticker.bestBid);
        }
      }
      this.logger.log('Ticker not found for ' + wallet.asset + ref  + ' in AllTicker...');
      return null;
    }
}
