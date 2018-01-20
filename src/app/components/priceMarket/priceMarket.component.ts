import { Component } from '@angular/core';
import { WebSocketService } from '@services/webSocket.service';
import { CoinMarketCapModel } from '@models/coinmarketcap.model';

@Component({
  selector: 'app-price-market',
  templateUrl: './priceMarket.component.html',
  styleUrls: ['./priceMarket.component.scss']
})
export class PriceMarketComponent {

  constructor(public webSocketService: WebSocketService) {
  }

  public history(type: string): string {
    if (!this.webSocketService.coinmarketcap.length) {
      return;
    }

    const find: CoinMarketCapModel = this.webSocketService.coinmarketcap.find((e) => {
      return e.symbol === 'TRX';
    });

    return typeof find[type] !== 'undefined' ? find[type] : '';
  }
}
