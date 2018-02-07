import { Promise } from 'es6-promise';
import { AccountModel } from '../models/account.model';
import BinanceRest from 'binance';
import Logger from '../Logger';
import { Wallet } from '../models/wallet.model';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import { CoinMarketCapModel } from '../models/coinmarketcap.model';
import SocketManager from './socket.manager';
import { SymbolPriceTickerModel } from '../models/symbolPriceTicker.model';

export default class AccountManager {
    private account: AccountModel;
    private logger: Logger;

    constructor(private binanceRest: BinanceRest,
                private socketManager: SocketManager) {
        this.logger = new Logger();

        this.binanceRest.account()
        .then((data) => {
          this.setAccount(data);
          this.logger.details('Retrieved account informations', this.getAccount());
        })
        .catch(console.error);
    }

    public setAccount(account: AccountModel) {
        this.account = account;
    }

    public getAccount(): AccountModel {
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

    public getHigherValueInWallet(): Promise<Wallet> {
      this.logger.log('Looking for the highest crypto in the wallet');

      return new Promise((resolve, reject) => {
        const wallet: Wallet[] = this.getWallet();
        this.binanceRest.tickerPrice({}, (err, prices: SymbolPriceTickerModel[]) => {
          if (prices) {
            let bestInWallet: any = {
              wallet: null,
              price: null
            };
            for (const w of wallet) {
              for (const p of prices) {
                if (w.asset !== p.symbol
                  && p.symbol === w.asset + SymbolToTrade.DEFAULT
                  && (bestInWallet.walllet === null ||  Number(p.price) * Number(w.free) > bestInWallet.price )) {
                  bestInWallet = { wallet: w, price: Number(p.price) * Number(w.free) };
                }
              }
            }
            const symbTotrade = this.getInWallet(SymbolToTrade.DEFAULT);
            if (symbTotrade && Number(symbTotrade.free) > bestInWallet.price) {
              bestInWallet = { wallet: symbTotrade, price: symbTotrade.free };
            }

            this.logger.details('Best crypto in the wallet is ' + bestInWallet.wallet.asset, bestInWallet);
            resolve(bestInWallet.wallet);
          }
          if (err) {
            this.logger.error('Error while getting symbols tickers prices', err);
            reject(err);
          }
        });
      });
    }

    private getWalletPrice(wallet: Wallet, ref: SymbolToTrade = SymbolToTrade.DEFAULT, price: string = 'best'): number {
      this.logger.log('Looking for the wallet price of ' + wallet.asset + ' in ' + ref + '.');

      if (wallet.asset === SymbolToTrade.DEFAULT) {
        return Number(wallet.free);
      }
      for (const ticker of this.socketManager.getAllTickers()) {
        console.log('ticker.symbol:', ticker.symbol);
        if (wallet.asset + ref === ticker.symbol) {
          return Number(wallet.free) * Number((price === 'best') ? ticker.bestAskPrice : ticker.bestBid);
        }
      }
      this.logger.log('Ticker not found for ' + wallet.asset + ref  + ' in AllTicker...');
      return null;
    }
}
