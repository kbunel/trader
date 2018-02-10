import 'dotenv/config';
import * as api from 'binance';
import { Promise } from 'es6-promise';
import { FrontModel } from './models/front.model';
import Transactions from './transactions';
import Indicators from './indicators';
import StrategyManager from './managers/strategy.manager';
import { StrategyConfig } from './interfaces/strategyConfig.interface';
import Logger from './logger';
import CoinMarketCapTools from './tools/coinMarketCap.tools';
import { AccountModel } from './models/account.model';
import AccountManager from './managers/account.manager';
import { Order } from './models/order.model';
import { BinanceEnum } from './enums/binance.enum';
import OrderManager from './managers/order.manager';
import { setTimeout } from 'timers';
import SocketManager from './managers/socket.manager';
import { SymbolToTrade } from './enums/symbolToTrade.enum';
import Trader from './tools/trader.service';

export default class Bot {

  private active: boolean = process.env.AUTO_START_BOT;

  private strategyManager: StrategyManager;
  private indicators: Indicators = null;
  private transactions: Transactions;
  private front: FrontModel;
  private logger: Logger;
  private coinMarketCapTools: CoinMarketCapTools;
  private binanceRest: any;
  private accountManager: AccountManager;
  private orderManager: OrderManager;
  private socketManager: SocketManager;
  private trader: Trader;

  constructor(server) {
    this.logger = new Logger();
    this.logger.log('Starting BOT');

    console.log(this.active);

    this.binanceRest = new api.BinanceRest({
      key: String(process.env.APIKEY),
      secret: String(process.env.APISECRET),
      recvWindow: 10000
    });
    this.socketManager = new SocketManager(this.binanceRest);
    this.orderManager = new OrderManager(this.binanceRest, this.accountManager, this.socketManager, this.trader);
    this.trader = new Trader(this.logger, this.socketManager, this.binanceRest);
    this.accountManager = new AccountManager(this.binanceRest, this.socketManager, this.trader);
    this.strategyManager = new StrategyManager(this.initStrategyConfig());

    // @TODO Put CoinMarketCapTools in a model or something else or remove it
    this.coinMarketCapTools = new CoinMarketCapTools();

    // useless one for BOT
    this.front = new FrontModel();
    this.indicators = new Indicators(this.front);

    // Should be passed away
    this.transactions = new Transactions(server, this.front, this.binanceRest);
    this.execute();
  }

  private execute(): void {
    console.log('\n\n\n\n\nExecuting');
    // if (this.accountManager && this.accountManager.getAccount()) {
    //   // this.logWalletPrice();
    // }
    if (process.env.LOOP_TIME <= 0) {
      this.logger.error('BAD LOOP_TIME');
      return;
    }
    // this.front.statusBot = this.active;
    // this.front.executeBotTime = Date.now();
    // this.transactions.sendDataFront();

    this.strategyManager.execute(process.env.STRATEGY)
    .then(() => {
      setTimeout(() => this.execute(), process.env.LOOP_TIME);
    })
    .catch(() => (process.env.LOOP_ACTIVE === 'true') ?
      setTimeout(() => this.execute(), process.env.LOOP_TIME) : null );
  }

  private initStrategyConfig(): StrategyConfig {
    return {
      trader: this.trader,
      transactions: this.transactions,
      front: this.front,
      indicators: this.indicators,
      logger: this.logger,
      coinMarketCapTools: this.coinMarketCapTools,
      accountManager: this.accountManager,
      orderManager: this.orderManager,
      socketManager: this.socketManager
    };
  }

  public start(): void {
    this.active = true;

    this.front.startBotTime = Date.now();
    this.front.stopBotTime = null;
  }

  public stop(): void {
    this.active = false;

    this.front.stopBotTime = Date.now();
    this.front.startBotTime = null;
  }

  private logWalletPrice(): void {
    console.log(this.accountManager.getWalletPriceTotal(SymbolToTrade.BTC).toString() + ' BTC - '
      + this.accountManager.getWalletPriceTotal(SymbolToTrade.ETH).toString() + ' ETH - '
      + this.accountManager.getWalletPriceTotal(SymbolToTrade.USDT).toString() + ' USDT');
  }
}
