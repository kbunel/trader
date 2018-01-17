import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

import { NgxElectronModule } from 'ngx-electron';

import { PriceMarketComponent } from '@components/priceMarket/priceMarket.component';
import { GraphComponent } from '@components/graph/graph.component';

import { WebSocketService } from '@services/webSocket.service';

import { AmChartsModule } from '@amcharts/amcharts3-angular';

@NgModule({
  declarations: [
    AppComponent,
    PriceMarketComponent,
    GraphComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxElectronModule,
    AmChartsModule
  ],
  providers: [
    WebSocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private sebSocketService: WebSocketService) {
  }
}
