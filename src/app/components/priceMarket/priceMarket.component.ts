import { Component } from '@angular/core';
import { WebSocketService } from '../../services/webSocket.service';

@Component({
  selector: 'price-market',
  templateUrl: './priceMarket.component.html'
})
export class PriceMarketComponent {

  constructor(public webSocketService: WebSocketService) {
    setInterval(()=> {
      console.log(webSocketService.aggTrade);
      console.log(webSocketService.allTickers);
      console.log(webSocketService.depth);
      console.log(webSocketService.trade);
      console.log(webSocketService.depthLevel);
      console.log(webSocketService.kline);
      console.log(webSocketService.ticker);
    }, 10000)
  }
}
