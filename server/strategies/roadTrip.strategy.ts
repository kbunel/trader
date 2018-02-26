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
import { setTimeout } from 'timers';
import { StrategyConfig } from '../interfaces/strategyConfig.interface';

export default class RoadTripStrategy extends Strategy {

  public strategyName = 'Road Trip Strategy';
  private bestInWallet: Wallet;
  private best: BestCoin;
  private coinMarketCapDatas: CoinMarketCapModel[] = [];

  constructor(strategyConfig: StrategyConfig) {
    super(strategyConfig);

    this.updateCoinMarketCapDatas();
  }

  public launch(): any {
    this.logger.log('Launching RoadTrip Strategy');

    return new Promise((resolve, reject): any => {
      if (!this.informationsRequired()) {
        this.logger.log('Missing informations to continue');
        reject();
        return;
      }

      const best: BestCoin = this.getBest();
      this.checkBestVariation(best);

      if (this.socketManager.getSymbolToWatch() !== best.symbol + SymbolToTrade.DEFAULT) {
        this.logger.log('Transactions not watching the good crypto, Let\'s watch it');

        this.socketManager.setSymbolToWatch(best.symbol);
        this.socketManager.resetCombinedSocket();

        resolve();
        return;
      } else {
        this.accountManager.getHigherValueInWallet()
          .then((wallet: Wallet) => {
            this.bestInWallet = wallet;

            if (!this.orderManager.getCurrentOrders(best.symbol).length && (wallet.asset === best.symbol
              || !this.isWorthyToSwitch(best))) {
              this.logger.log('We got ' + wallet.asset + ', let\'s hold for now');

              this.getBestFromCoinMarketCap(this.coinMarketCapTools.P_1H);
              this.getBestFromBinance();
              this.orderManager.sellEverything(best.symbol);
              this.orderManager.buyIfPossible(best.symbol);
            } else if (this.orderManager.getCurrentOrders(best.symbol).length) {
              this.logger.log('Best ticker found in current order, let\'s check if it s still available');

              for (const order of this.orderManager.getCurrentOrders(best.symbol)) {
                if (order.symbol === best.symbol + SymbolToTrade.DEFAULT && order.side === BinanceEnum.SIDE_SELL) {
                  this.orderManager.cancelOrder(order);
                } else {
                  this.orderManager.resetOrdersIfTooLong(process.env.FORCE_MARKET_PRICE_TIMING, best);
                }
              }
            } else if (wallet.asset !== SymbolToTrade.DEFAULT && this.orderManager.getCurrentOrders(SymbolToTrade.DEFAULT).length) {

              this.logger.log('Orders with symbol to trade found, let\'s check if it s still available or reset it with market price if taking too long in profit_limit');
              this.orderManager.resetOrdersIfTooLong(process.env.FORCE_MARKET_PRICE_TIMING, best);
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
                      this.logger.error('Error trying to send an order in RoadTrip strategy', error);
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
    });
  }

  private getBest(from: string = process.env.TAKE_BEST_FROM): BestCoin {
    if (from === CoinSource.binance) {
      const best: TickerModel = this.getBestFromBinance();
      const bestC: BestCoin = new BestCoin(best.symbol.replace(SymbolToTrade.DEFAULT, ''), Number(best.priceChangePercent));
      bestC.price = Number(best.bestAskPrice);

      return bestC;
    } else if (from === CoinSource.coinmarketcap) {
      const coin: CoinMarketCapModel = this.getBestFromCoinMarketCap(this.coinMarketCapTools.P_1H);
      const bestC: BestCoin = new BestCoin(coin.symbol, Number(coin.percent_change_1h));
      bestC.price = Number(coin.price_btc);

      return bestC;
    } else {
      this.logger.error('No source for getting best coin...');
    }
  }

  private getBestFromCoinMarketCap(key: string): CoinMarketCapModel {
    this.logger.log('Looking for the best Crypto with highest ' + key);

    const selection: CoinMarketCapModel[] = this.getAvailablesCoins();
    this.logger.detailsIf(false, 'Retrieved selection done from Binance & CoinMArketCap', selection);

    const best: CoinMarketCapModel = selection.sort((a: CoinMarketCapModel, b: CoinMarketCapModel) => {
      return Number(b[key]) - Number(a[key]);
    })[0];

    this.logger.details('Best from CoinmarkerCap after selected Binance ones in common is ' + best.symbol
      + ' - ' + best.price_btc + ' BTC - '
      + best.price_usd + ' $ - '
      + best.percent_change_1h + '% / 1h',
      best);

    return best;
  }

  private getBestFromBinance(): TickerModel {
    this.logger.log('Looking for the best Crypto with highest priceChangePercent from Binance');

    let best: TickerModel;
    for (const t of this.socketManager.getAllTickers()) {
      if (!best && t.symbol.match('BTC') && t.symbol !== 'ETHBTC') {
        best = t;
      } else if (best && Number(t.priceChangePercent) > Number(best.priceChangePercent) && t.symbol.match('BTC')) {
        best = t;
      }
    }
    this.logger.details('Best from Binance is ' + best.symbol + ' (' + best.priceChangePercent + '% / 24h)', best);
    return best;
  }

  private getAvailablesCoins(): CoinMarketCapModel[] {
    const selected: CoinMarketCapModel[] = [];

    const coinMakerCapDatas: CoinMarketCapModel[] = this.getCoinMarketCapDatas();
    const allTickers: TickerModel[] = this.socketManager.getAllTickers();
    this.logger.detailsIf(false, 'Get datas from coinmarketCap', coinMakerCapDatas);
    this.logger.detailsIf(false, 'Get datas from tickers', allTickers);

    for (const c of coinMakerCapDatas) {
      for (const t of allTickers) {
        if (c.symbol + 'BTC' === t.symbol || c.symbol + 'ETH' === t.symbol) {
          selected.push(c);
          break;
        }
      }
    }

    return selected;
  }

  private getCoinMarketCapDatas(): CoinMarketCapModel[] {
    return this.coinMarketCapDatas;
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

    if (!this.coinMarketCapDatas) {
      this.logger.log('CoinmarketCap datas missing');
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
    let bestInWallet: BestCoin;

    if (from === CoinSource.coinmarketcap || this.bestInWallet.asset === SymbolToTrade.DEFAULT) {
      const bestInCP: CoinMarketCapModel = this.getCoinMarketCapValueFor(this.bestInWallet.asset);
      bestInWallet = new BestCoin(bestInCP.symbol, Number(bestInCP.percent_change_1h), Number(bestInCP.price_btc));
    } else if (from === CoinSource.binance) {
      const bestInPercentFromBinance: TickerModel = this.socketManager.getTicker(this.bestInWallet.asset);
      bestInWallet = new BestCoin(bestInPercentFromBinance.symbol, Number(bestInPercentFromBinance.priceChangePercent));
    } else {
      this.logger.log('Didnt get bestPercent in wallet, from is not valid...');
    }

    return bestInWallet;
  }

  private checkBestVariation(currentBest: BestCoin) {
    if (!this.best) {
      this.best = currentBest;
      this.best.variation = 0;
    } else if (currentBest.symbol === this.best.symbol) {
      if (this.best.price > currentBest.price) {
        this.best.variation--;
        this.best.price = currentBest.price;
      } else if (this.best.price < currentBest.price) {
        this.best.variation++;
        this.best.price = currentBest.price;
      }
    } else if (currentBest.symbol !== this.best.symbol) {
      this.best = currentBest;
    }
    this.logger.log(this.best.symbol + ' variation: ' + this.best.variation);
  }

  private updateCoinMarketCapDatas(): void {
    this.logger.log('Updating CoinMarketCapDatas');
    const request = new Client();

    try {
      request.get(process.env.API_COINMARKETCAP, (data, response) => {
        if (data) {
          this.coinMarketCapDatas = data;
        } else {
          this.logger.error('No data get from CoinMarketCap');
        }
      });
    } catch (error) {
      this.logger.error(error);
    }
    setTimeout(() => this.updateCoinMarketCapDatas(), 10000);
  }
}
