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

      this.getBest(this.coinMarketCapTools.P_1H)
      .then((best1HrPercent: CoinMarketCapModel) => {

        if (this.socketManager.getSymbolToWatch() !== best1HrPercent.symbol + SymbolToTrade.DEFAULT) {
          this.logger.log('Transactions not watching the good crypto, Let\'s watch it');

          this.socketManager.setSymbolToWatch(best1HrPercent.symbol);
          this.socketManager.resetCombinedSocket();

          resolve();
          return;
        }  else {
          this.accountManager.getHigherValueInWallet()
          .then((wallet: Wallet) => {
            this.bestInWallet = wallet;

            if (wallet.asset === best1HrPercent.symbol
              || !this.isWorthyToSwitch(best1HrPercent)) {
              this.logger.log('We got ' + wallet.asset + ', let\'s hold for now');

            } else if (this.orderManager.getCurrentOrders(best1HrPercent.symbol).length) {
              this.logger.log('Best 1Hr Percent found in current order, let\'s check if it s still available');

              this.orderManager.resetOrdersIfTooLong(5);
            } else if (wallet.asset !== SymbolToTrade.DEFAULT && this.orderManager.getCurrentOrders(SymbolToTrade.DEFAULT).length) {

              this.logger.log('Orders with symbol to trade found, let\'s check if it s still available or reset it with market price if taking too long in profit_limit');
              this.orderManager.resetOrdersIfTooLong(5);
            } else if (this.orderManager.getCurrentOrders().length) {
              this.logger.log('Crypto ' + best1HrPercent.symbol + ' not in wallet and not in current orders'
              + ' but orders found, let\'s cancel them all to buy the good crypto');

              this.orderManager.cancelAllOrders(wallet.asset + SymbolToTrade.DEFAULT);
            } else if (wallet.asset !== SymbolToTrade.DEFAULT) {
              this.logger.log('Crypto ' + best1HrPercent.symbol + ' not in wallet and not in current orders,'
              + ' let\' s get some ' + SymbolToTrade.DEFAULT + ' to buy it');

              this.orderManager.sellEverything(best1HrPercent.symbol);
            } else {
              this.logger.log('Let\'s buy some ' + best1HrPercent.symbol);

              this.orderManager.createNewBuyOrder(best1HrPercent.symbol)
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

  private getBest(key: string): Promise<CoinMarketCapModel> {
    this.logger.log('Looking for the best Crypto with highest ' + key);

    return new Promise((resolve, reject) => {
      this.getAvailablesCoins()
      .then((selection: CoinMarketCapModel[]) => {
        this.logger.detailsIf(false, 'Retrieved selection done from Binance & CoinMArketCap', selection);

        const best: CoinMarketCapModel = selection.sort((a: CoinMarketCapModel, b: CoinMarketCapModel) => {
          return Number(b[key]) - Number(a[key]);
        })[0];

        this.logger.details('Best is ' + best.symbol
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

  private isWorthyToSwitch(symbolToSwitchFor: CoinMarketCapModel): boolean {
    this.logger.log('Checking if it is worthy to switch crypto place');

    const currentCrypto: CoinMarketCapModel = this.getCoinMarketCapValueFor(this.bestInWallet.asset);

    if (Number(symbolToSwitchFor.percent_change_1h) > Number(currentCrypto.percent_change_1h) + 1) {
      this.logger.log('It is worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change_1h
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change_1h + ')');
      return true;
    } if (Number(symbolToSwitchFor.percent_change_1h) > 0 && Number(currentCrypto.percent_change_1h) < 0) {
      this.logger.log('It is worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change_1h
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change_1h + ')');
      return true;
    } else {
      this.logger.log('Not worthy to change: current: ' + currentCrypto.symbol + '(' + currentCrypto.percent_change_1h
      + ') VS ' + symbolToSwitchFor.symbol + '(' + symbolToSwitchFor.percent_change_1h + ')');
      return false;
    }
  }
}
