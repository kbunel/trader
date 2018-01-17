
import * as api from 'binance';
import 'dotenv/config';

const SYMBOL: string = String(process.env.ALTCOIN) + String(process.env.COIN);
const SELL_ORDER: string = 'SELL';
const BUY_ORDER: string = 'BUY';

const binanceRest = new api.BinanceRest({
  key: String(process.env.APIKEY),
  secret: String(process.env.APISECRET),
});
const binanceWS = new api.BinanceWS(true);

let current: number = Number(process.env.PRICE_START);
let action: string = SELL_ORDER; // buy - sell
let statusOrderInProgress: boolean = false;
let value: number = null;

binanceWS.onTrade(SYMBOL, (data: any) => value = financial(data.price));

console.log('start');

setInterval(() => {
  if (!value) {
    return;
  }

  const valueMax: number = financial(current + Number(process.env.SIZE_DIFF_ORDER));
  const valueMin: number = financial(current - Number(process.env.SIZE_DIFF_ORDER));

  // console.log('value', value);
  // console.log('current', current);
  // console.log('valueMin', valueMin);
  // console.log('valueMax', valueMax);
  // console.log('action', action);

  if (!statusOrderInProgress) {
    if (valueMax < value && action === SELL_ORDER) {
      console.log('vendu à ' + value + ' (' + current + ')');

      newOrder(SELL_ORDER, value);
    } else if (valueMin > value && action === BUY_ORDER) {
      console.log('acheté à ' + value + ' (' + current + ')');

      newOrder(BUY_ORDER, value);
    }
  }

  binanceRest.openOrders({
    symbol: SYMBOL,
    timestamp: Date.now()
  })
    .then((dataOrders: any) => statusOrderInProgress = !!dataOrders.length)
    .catch((err: any) => console.error('openOrders', err));
}, 1000);

function financial(x: number): number {
  return Number(Number(x).toFixed(Number(process.env.DECIMAL)));
}

function newOrder(side: string, price: number): void {
  statusOrderInProgress = true;
  binanceRest.newOrder({
    symbol: SYMBOL,
    type: 'LIMIT',
    timeInForce: 'GTC',
    timestamp: Date.now(),
    quantity: process.env.QUANTITY,
    price,
    side
  })
    .then((data: any) => {
      current = price;
      action = action === SELL_ORDER ? BUY_ORDER : SELL_ORDER;
      console.log('ORDER', side, price, data);
    })
    .catch((err: any) => {
      statusOrderInProgress = false;
      console.error('newOrder', err);
    });
}
