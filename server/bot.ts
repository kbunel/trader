import 'dotenv/config';
import { BinanceEnum } from './enum';
import Transactions from './transactions';
import Indicators from './indicators';

export default class Bot extends Transactions {

  public priceCurrent: number = null;
  public action: string = BinanceEnum.SIDE_SELL;

  private active: boolean = process.env.AUTO_START_BOT === 'true';
  private indicators: Indicators = null;

  /**
   *
   * @param server
   */
  constructor(server) {
    super(server);

    this.indicators = new Indicators();

    this.loop();
  }

  /**
   *
   */
  public start(): void {
    this.active = true;
  }

  /**
   *
   */
  public stop(): void {
    this.active = false;
  }

  /**
   *
   */
  private execute(): void {
    this.front.statusBot = this.active;

    if (!this.active) {
      return this.loop();
    }

    if (!this.priceCurrent) {
      this.priceCurrent = Number(this.trade.price);
    }

    console.log(this.trade);
    this.haveOrder()
      .then((status: boolean) => {
        if (!status && this.indicators.validateOrder(this.priceCurrent, Number(this.trade.price), this.action)) {
          const price: number = this.indicators.price();

          this.sendOrder(this.action, price)
            .then(() => {
              this.priceCurrent = price;
              this.action = this.action === BinanceEnum.SIDE_SELL ? BinanceEnum.SIDE_BUY : BinanceEnum.SIDE_SELL;

              this.loop();
            })
            .catch(() => this.loop());
        } else {
          this.loop();
        }
      })
      .catch(() => this.loop());
  }

  /**
   *
   */
  private loop(): void {
    this.sendDataFront();
    setTimeout(() => this.execute(), 1000);
  }
}
