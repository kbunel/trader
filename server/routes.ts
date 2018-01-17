import 'dotenv/config';
import * as api from 'binance';

export default class Routes {

  private binanceRest = null;
  private bot = null;

  constructor(bot) {
    this.bot = bot;
    this.binanceRest = new api.BinanceRest({
      key: String(process.env.APIKEY),
      secret: String(process.env.APISECRET),
    });
  }

  public list() {
    return [
      {
        method: 'GET',
        path: '/config/:symbol/:interval',
        handlers: [
          (req, res) => {
            const data = {
              symbol: req.params.symbol,
              interval: req.params.interval
            };
            this.bot.changeConfig(data);
            res.send(data);
          }
        ]
      },
      {
        method: 'GET',
        path: '/klines/:interval*?',
        handlers: [
          (req, res) => {
            const data = {
              interval: req.params.interval
            };
            this.bot.changeConfig(data);

            this.binanceRest.klines({
              symbol: this.bot.symbol,
              interval: this.bot.interval
            })
              .then((data) => res.send(data))
              .catch((err) => res.send(err));
          }
        ]
      }
    ];
  }
}
