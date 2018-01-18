import * as technicalindicators from 'technicalindicators';
import { BinanceEnum } from './enum';

export default class Indicators {
  public decimal: string = String(process.env.DECIMAL);

  private indicators: any = null;
  private priceOrder: number = null;

  /**
   *
   */
  constructor() {
    this.indicators = technicalindicators;
  }

  /**
   *
   * @param {number} priceCurrent
   * @param {number} price
   * @param {string} action
   * @returns {boolean}
   */
  public validateOrder(priceCurrent: number, price: number, action: string): boolean {
    if (!priceCurrent || !price) {
      return false;
    }

    const valueMax: number = this.financial(Number(priceCurrent) + Number(process.env.SIZE_DIFF_ORDER));
    const valueMin: number = this.financial(Number(priceCurrent) - Number(process.env.SIZE_DIFF_ORDER));
    const output: boolean = ((valueMax < price && action === BinanceEnum.SIDE_SELL) || (valueMin > price && action === BinanceEnum.SIDE_BUY));

    console.log(valueMin, priceCurrent, valueMax, action, output);

    if (output) {
      this.priceOrder = price;

      if (action === BinanceEnum.SIDE_SELL) {
        console.log('vendu à ' + price + ' (' + priceCurrent + ')');
      } else if (action === BinanceEnum.SIDE_BUY) {
        console.log('acheté à ' + price + ' (' + priceCurrent + ')');
      }
    }

    return output;
  }

  /**
   *
   */
  public price(): number {
    return this.priceOrder;
  }

  /**
   *
   * @param {number} x
   * @returns {number}
   */
  public financial(x: number): number {
    return Number(Number(x).toFixed(Number(this.decimal)));
  }
}
