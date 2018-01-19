import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

import { NgxElectronModule } from 'ngx-electron';

import { WebSocketService } from '@services/webSocket.service';
import { SortService } from '@services/sort.service';

import { AmChartsModule } from '@amcharts/amcharts3-angular';

import { PriceMarketComponent } from '@components/priceMarket/priceMarket.component';
import { GraphComponent } from '@components/graph/graph.component';

import { BotComponent } from '@components/bot/bot.component';
import { BotConfigComponent } from '@components/bot/bot-config/bot-config.component';
import { BotLogsComponent } from '@components/bot/bot-logs/bot-logs.component';

import { ServerComponent } from '@components/server/server.component';
import { CoinmarketcapComponent } from '@components/coinmarketcap/coinmarketcap.component';

import { SortableColumnComponent } from '@components/sortable-column/sortable-column.component';
import { SortDirective } from '@directives/sort.directive';

@NgModule({
  declarations: [
    AppComponent,
    PriceMarketComponent,
    GraphComponent,
    BotComponent,
    ServerComponent,
    BotConfigComponent,
    BotLogsComponent,
    CoinmarketcapComponent,
    SortableColumnComponent,
    SortDirective
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxElectronModule,
    AmChartsModule
  ],
  providers: [
    WebSocketService,
    SortService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private sebSocketService: WebSocketService) {
  }
}
