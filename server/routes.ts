import 'dotenv/config';

export default class Routes {

  private binanceRest = null;
  private bot = null;

  /**
   *
   * @param bot
   */
  constructor(bot) {
    this.bot = bot;
    this.binanceRest = this.bot.binanceRest;
  }

  /**
   *
   * @returns {any[]}
   */
  public list(): any[] {
    return [
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
            const params = {
              interval: req.params.interval
            };
            this.bot.changeConfig(params);

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
