import { Component } from '@angular/core';
import { WebSocketService } from '@services/webSocket.service';

@Component({
  selector: 'app-price-market',
  templateUrl: './priceMarket.component.html'
})
export class PriceMarketComponent {

  constructor(public webSocketService: WebSocketService) {
  }
}
