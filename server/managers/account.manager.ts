import { Promise } from 'es6-promise';
import { AccountModel } from '../models/account.model';
import BinanceRest from 'binance';
import Logger from '../logger';
import { Wallet } from '../models/wallet.model';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import { CoinMarketCapModel } from '../models/coinmarketcap.model';
import SocketManager from './socket.manager';
import { SymbolPriceTickerModel } from '../models/symbolPriceTicker.model';
import { OutboundBalances } from '../models/outboundAccountInfo.model';
import Trader from '../tools/trader.service';
import { EventEmitter } from 'events';

export default class AccountManager {
    private account: AccountModel;
    private logger: Logger;

    public eventEmitter = new EventEmitter();

    constructor(private binanceRest: BinanceRest,
                private socketManager: SocketManager,
                private trader: Trader) {
        this.logger = new Logger();

        this.logger.log('Activating AccountManager');

        this.getAccountFromBinance();
        this.subscribeToEvents();
    }

    public setAccount(account: AccountModel) {
        this.account = account;
        if (process.env.REMOVE_FROM_WALLET) {
          this.removeFromWallet(process.env.REMOVE_FROM_WALLET);
        }
    }

    public getAccount(): AccountModel {
        return this.account;
    }

    public getAccountFromBinance() {
      this.binanceRest.account()
        .then((data) => {
          this.setAccount(data);
          this.logger.details('Retrieved account informations', data);
        })
        .catch((error) => {
          console.error('Error while getting account from Binance', error);
          if (error.code === -1000) {
            this.logger.log('Unknown error located, trying again in 5 sec.');

            // setTimeout(() => this.getAccountFromBinance(), 50000);
          }
        });
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

    public getInWallet(symbol: string, log: boolean = false): Wallet {
      this.logger.logIf(log, 'Looking for ' + symbol + ' in wallet');
      const wallet = this.getWallet();
      for (const w of wallet) {
        if (w.asset === symbol) {
          this.logger.detailsIf(log, symbol + ' found in wallet', w);
          return w;
        }
      }
      this.logger.log(symbol + ' not found in wallet...');
      return null;
    }

    public removeFromWallet(symbol: string): void {
      this.logger.log('Trying to remove ' + symbol + ' from wallet');
      for (const i in this.account.balances) {
        if (this.account.balances[+i].asset === symbol) {
            this.logger.details(this.account.balances[+i].asset + ' removed from wallet');

            this.logger.log(symbol + ' found and removed');
            this.account.balances.splice(+i, 1);

            return;
        }
      }

      this.logger.log(symbol + ' not found in wallet so not removed');
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

    public getWalletPriceTotal(ref: SymbolToTrade, price: string = 'best'): void {
      let walletPriceTotal: number = 0;
      const promises: Promise<number>[] = [];

      for (const w of this.getWallet()) {
          promises.push(new Promise((resolve, reject) => {
            this.trader.getPrice(w.asset, ref)
            .then((cryptoPrice: number) => {
              resolve(Number(w.free) * cryptoPrice);
            })
            .catch((error) => {
              this.logger.error(error);
            });
          }));
      }

      Promise.all(promises)
      .then((results: number[]) => {
        for (const r of results) {
          walletPriceTotal += r;
        }
        this.eventEmitter.emit('walletPriceTotal' + ref + price, walletPriceTotal);
      })
      .catch((error) => {
        this.logger.error(error);
      });
    }

    private subscribeToEvents(): void {
      this.socketManager.eventEmitter.on('balances', (balances) => {
        this.logger.details('Received balances from socket', balances);

        this.updateWalletFromBalances(balances);
      });
    }

    private updateWalletFromBalances(balances: OutboundBalances[]): void {
      this.logger.details('Updating account balances with new balances', balances);

      for (const w of this.account.balances) {
        for (const balance of balances) {
          if (w.asset === balance.asset) {
            w.free = balance.availableBalance;
            w.locked = balance.onOrderBalance;

            break ;
          }
        }
      }

      this.logger.details('Account balances updated', this.account.balances);
    }
}
