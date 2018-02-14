import 'dotenv/config';
import * as express from 'express';

export default class Routes {

  private binanceRest = null;
  private bot = null;

  /**
   *
   * @param bot
   */
  constructor(server, bot) {
    this.bot = bot;
  }

  /**
   *
   * @returns {any[]}
   */
  public list(): any[] {
    return [
      {
        method: 'GET',
        path: '/',
        handlers: [
          (req, res) => {
            res.sendFile(__dirname + '/views/index.html');
          }
        ]
      },
      {
        method: 'GET',
        path: '/server/:startOrStop',
        handlers: [
          (req, res) => {
            if (req.params.startOrStop === 'start') {
              this.bot.start();
            } else if (req.params.startOrStop === 'stop') {
              this.bot.stop();
            }
            res.send(req.params.startOrStop);
          }
        ]
      },
      {
        method: 'GET',
        path: '/config/:symbol/:interval',
        handlers: [
          (req, res) => {
            const data = {
              symbol: req.params.symbol,
              interval: req.params.interval
            };
            this.bot.transactions.changeConfig(data);
            res.send(data);
          }
        ]
      },
      {
        method: 'GET',
        path: '/klines/:interval*?',
        handlers: [
          (req, res) => {
            const params = {
              interval: req.params.interval
            };
            this.bot.transactions.changeConfig(params);

            this.bot.transactions.binanceRest.klines({
              symbol: this.bot.transactions.symbol,
              interval: this.bot.transactions.interval
            })
              .then((data) => res.send(data))
              .catch((err) => res.send(err));
          }
        ]
      },
      {
        method: 'GET',
        path: '/allPrices',
        handlers: [
          (req, res) => {
            this.bot.transactions.binanceRest.allPrices()
              .then((data) => res.send(data))
              .catch((err) => res.send(err));
          }
        ]
      }
    ];
  }
}
