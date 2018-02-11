import Strategy from './strategy';
import { CoinMarketCapModel } from './../models/coinmarketcap.model';
import { Promise } from 'es6-promise';
import CoinMarketCapTools from '../tools/coinMarketCap.tools';
import { Wallet } from '../models/wallet.model';
import { Order } from '../models/order.model';
import { NewOrder } from '../models/newOrder.model';
import { BinanceEnum } from '../enums/binance.enum';
import { SymbolToTrade } from '../enums/symbolToTrade.enum';
import { Client } from 'node-rest-client';
import { TickerModel } from '../models/ticker.model';
import { BestCoin, CoinSource } from '../models/bestCoin.model';

export default class RoadTripStrategy extends Strategy {

  public strategyName = 'Road Trip Strategy';
  private bestInWallet: Wallet;

  public launch(): any {
    this.logger.log('Launching RoadTrip Strategy');

    return new Promise((resolve, reject): any => {
      if (!this.informationsRequired()) {
        this.logger.log('Missing informations to continue');
        reject();
        return;
      }

      this.getBest()
      .then((best: BestCoin) => {

        if (this.socketManager.getSymbolToWatch() !== best.symbol + SymbolToTrade.DEFAULT) {
          this.logger.log('Transactions not watching the good crypto, Let\'s watch it');

          this.socketManager.setSymbolToWatch(best.symbol);
          this.socketManager.resetCombinedSocket();

          resolve();
          return;
        }  else {
          this.accountManager.getHigherValueInWallet()
          .then((wallet: Wallet) => {
            this.bestInWallet = wallet;

            if (wallet.asset === best.symbol
              || !this.isWorthyToSwitch(best)) {
              this.logger.log('We got ' + wallet.asset + ', let\'s hold for now');

            } else if (this.orderManager.getCurrentOrders(best.symbol).length) {
              this.logger.log('Best 1Hr Percent found in current order, let\'s check if it s still available');

              this.orderManager.resetOrdersIfTooLong(5);
            } else if (wallet.asset !== SymbolToTrade.DEFAULT && this.orderManager.getCurrentOrders(SymbolToTrade.DEFAULT).length) {

              this.logger.log('Orders with symbol to trade found, let\'s check if it s still available or reset it with market price if taking too long in profit_limit');
              this.orderManager.resetOrdersIfTooLong(5);
            } else if (this.orderManager.getCurrentOrders().length) {
              this.logger.log('Crypto ' + best.symbol + ' not in wallet and not in current orders'
              + ' but orders found, let\'s cancel them all to buy the good crypto');

              this.orderManager.cancelAllOrders(wallet.asset + SymbolToTrade.DEFAULT);
            } else if (wallet.asset !== SymbolToTrade.DEFAULT) {
              this.logger.log('Crypto ' + best.symbol + ' not in wallet and not in current orders,'
              + ' let\' s get some ' + SymbolToTrade.DEFAULT + ' to buy it');

              this.orderManager.sellEverything(best.symbol);
            } else {
              this.logger.log('Let\'s buy some ' + best.symbol);

              this.orderManager.createNewBuyOrder(best.symbol)
              .then((newBuyOrder: NewOrder) => {
                this.orderManager.sendNewOrder(newBuyOrder)
                .then((order: Order) => {
                  this.logger.details('New buy order for ' + order.symbol + ' sent', order);
                  resolve(order);
                })
                .catch((error) => {
                  this.logger.error('Error trying to send an order', error);
                });
              })
              .catch((error) => {
                this.logger.error('Error trying create a newBuyOrder', error);
                reject(error);
              });
            }
            resolve();
            return;
          })
          .catch((error) => this.logger.error(error));
        }
      })
      .catch((error) => {
        this.logger.error(error);
        reject(error);
      });
    });
  }

  private getBest(from: string = process.env.TAKE_BEST_FROM): Promise<BestCoin> {
    return new Promise((resolve, reject) => {
      if (from === CoinSource.binance) {
        const best: TickerModel = this.getBestFromBinance();
        resolve(new BestCoin(best.symbol, Number(best.priceChangePercent)));
      } else if ( from === CoinSource.coinmarketcap) {
        this.getBestFromCoinMarketCap(this.coinMarketCapTools.P_1H)
        .then((coin: CoinMarketCapModel) => {
          resolve(new BestCoin(coin.symbol, Number(coin.percent_change_1h)));
        })
        .catch((error) => {
          reject(error);
        });
      } else {
        reject('No source for getting best coin...');
      }
    });
  }

  private getBestFromCoinMarketCap(key: string): Promise<CoinMarketCapModel> {
    this.logger.log('Looking for the best Crypto with highest ' + key);

    return new Promise((resolve, reject) => {
      this.getAvailablesCoins()
      .then((selection: CoinMarketCapModel[]) => {
        this.logger.detailsIf(false, 'Retrieved selection done from Binance & CoinMArketCap', selection);

        const best: CoinMarketCapModel = selection.sort((a: CoinMarketCapModel, b: CoinMarketCapModel) => {
          return Number(b[key]) - Number(a[key]);
        })[0];

        this.logger.details('Best from CoinmarkerCap after selected Binance ones in common is ' + best.symbol
        + ' - ' + best.price_btc + ' BTC - '
        + best.price_usd + ' $ - '
        + best.percent_change_1h + ' %',
         best);
        resolve(best);
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  private getBestFromBinance(): TickerModel {
    this.logger.log('Looking for the best Crypto with highest priceChangePercent from Binance');

    let best: TickerModel = this.socketManager.getAllTickers()[0];
    for (const t of this.socketManager.getAllTickers()) {
      if (t.priceChangePercent > best.priceChangePercent) {
        best = t;
      }
    }
    this.logger.details('Best from Binance is ' + best.symbol);
    return best;
  }

  private getAvailablesCoins(): Promise<CoinMarketCapModel[]> {
    return new Promise((resolve, reject) => {
      const selected: CoinMarketCapModel[] = [];

      this.getCoinMarketCapDatas()
      .then((coinMakerCapDatas: CoinMarketCapModel[]) => {
        this.logger.detailsIf(false, 'Get datas from coinmarketCap', coinMakerCapDatas);

        for (const c of coinMakerCapDatas) {
          for (const t of this.socketManager.getAllTickers()) {
            if (c.symbol + 'BTC' === t.symbol || c.symbol + 'ETH' === t.symbol) {
              selected.push(c);
              break;
            }
          }
        }
        resolve(selected);
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  private getCoinMarketCapDatas(): Promise<CoinMarketCapModel[]> {
    return new Promise((resolve, reject) => {
      this.logger.log('Getting datas from CoinMarketCap');
      const request = new Client();

      request.get(process.env.API_COINMARKETCAP, (data, response) => {
        (data) ? resolve(data) : reject('No data get from CoinMarketCap');
      });
    });
  }

  private informationsRequired(): boolean {
    this.logger.log('Checking informations');

    if (!this.socketManager.getAllTickers().length) {
      this.logger.details('allTickers missing', this.socketManager.getAllTickers());
      return false;
    }

    if (!this.accountManager.getAccount()) {
      this.logger.log('Account missing');
      return false;
    }

    if (!this.orderManager.getExchangeInfo()) {
      this.logger.log('ExchangeInfo missing');
      return false;
    }

    return true;
  }

  private getCoinMarketCapValueFor(symbol: string): CoinMarketCapModel {
    this.logger.log('Looking for coinMarketCap value informations for ' + symbol);

    for (const c of this.transactions.coinmarketcap) {
      if (c.symbol === symbol) {
        return c;
      }
    }

    this.logger.error('CoinMarketCap informations for ' + symbol + ' not found...');
    return null;
  }

  private isWorthyToSwitch(symbolToSwitchFor: BestCoin): boolean {
    this.logger.log('Checking if it is worthy to switch crypto place');

    const currentCrypto: BestCoin = this.getBestPercentInWallet(process.env.TAKE_BEST_FROM);

    if (symbolToSwitchFor.percent_change > currentCrypto.percent_change + 1) {
      this.logger.log('It is worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change + ')');
      return true;
    } else if (symbolToSwitchFor.percent_change > 0 && currentCrypto.percent_change < 0) {
      this.logger.log('It is worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change + ')');
      return true;
    } else {
      this.logger.log('Not worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change + ')');
      return false;
    }
  }

  private getBestPercentInWallet(from: string): BestCoin {
    console.log('ccc', this.bestInWallet.asset, this.bestInWallet.asset === SymbolToTrade.DEFAULT);
    let bestInWallet: BestCoin;

    if  (from === CoinSource.coinmarketcap || this.bestInWallet.asset === SymbolToTrade.DEFAULT) {
        const bestInCP: CoinMarketCapModel = this.getCoinMarketCapValueFor(this.bestInWallet.asset);
        bestInWallet = new BestCoin(bestInCP.symbol, Number(bestInCP.percent_change_1h));
    } else if (from === CoinSource.binance) {
        const bestInPercentFromBinance: TickerModel = this.socketManager.getTicker(this.bestInWallet.asset);
        bestInWallet = new BestCoin(bestInPercentFromBinance.symbol, Number(bestInPercentFromBinance.priceChangePercent));
    } else {
      this.logger.log('Didnt get bestPercent in wallet, from is not valid...');
    }

    return bestInWallet;
  }
}
