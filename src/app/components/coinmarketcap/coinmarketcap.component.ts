import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '@services/webSocket.service';
import { CoinMarketCapModel } from '@models/coinmarketcap.model';

@Component({
  selector: 'app-coinmarketcap',
  templateUrl: './coinmarketcap.component.html',
  styleUrls: ['./coinmarketcap.component.scss']
})
export class CoinmarketcapComponent implements OnInit {

  private sortColumn: string = 'name';
  private sortDirection: string = 'asc';

  constructor(public webSocketService: WebSocketService) {
    this.webSocketService.coinmarketcapSubscribe.subscribe(() => this.onSorted());
  }

  public ngOnInit() {
    this.sortColumn = 'name';
    this.sortDirection = 'asc';

    this.onSorted();
  }

  public HandleClickSort(event) {
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
