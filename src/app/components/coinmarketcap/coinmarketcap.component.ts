import { Component } from '@angular/core';
import { WebSocketService } from '@services/webSocket.service';
import { CoinMarketCapModel } from '@models/coinmarketcap.model';

@Component({
  selector: 'app-coinmarketcap',
  templateUrl: './coinmarketcap.component.html',
  styleUrls: ['./coinmarketcap.component.scss']
})
export class CoinmarketcapComponent {

  private sortColumn: string = '';
  private sortDirection: string = '';

  constructor(public webSocketService: WebSocketService) {
    webSocketService.coinmarketcapSubscribe.subscribe(() => this.onSorted());
  }

  public HandleClickSort(event) {
    console.log(event);
    this.sortColumn = event.sortColumn;
    this.sortDirection = event.sortDirection;

    this.onSorted();
  }

  public onSorted() {
    this.webSocketService.coinmarketcap.sort((a: CoinMarketCapModel, b: CoinMarketCapModel): number => {
      if (this.sortColumn === 'price_btc' || this.sortColumn === 'percent_change_1h' || this.sortColumn === 'percent_change_24h') {
        if (this.sortDirection === 'desc') {
          return Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        }

        return Number(b[this.sortColumn]) - Number(a[this.sortColumn]);

      } else {
        if (this.sortDirection === 'desc') {
          return a[this.sortColumn] < b[this.sortColumn] ? 1 : -1;
        }

        return a[this.sortColumn] > b[this.sortColumn] ? 1 : -1;
      }
    });
  }
}
