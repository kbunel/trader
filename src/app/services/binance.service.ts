import { Injectable } from '@angular/core';
import * as api from 'binance';
import { environment } from '../../environments/environment';

@Injectable()
export class BinanceService {

  public binanceRest: api = null;
  public binanceWS: api = null;

  constructor() {
    this.binanceRest = new api.BinanceRest({
      key: environment.binance.key,
      secret: environment.binance.secret,
    });

    this.binanceWS = new api.BinanceWS(true);
  }
}
