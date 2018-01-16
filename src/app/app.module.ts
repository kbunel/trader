import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { PriceMarketComponent } from './components/priceMarket/priceMarket.component';
import { GraphComponent } from './components/graph/graph.component';

import { WebSocketService } from './services/webSocket.service';

import { NvD3Module } from 'ng2-nvd3';
import 'd3';
import 'nvd3';

@NgModule({
  declarations: [
    AppComponent,
    PriceMarketComponent,
    GraphComponent
  ],
  imports: [
    BrowserModule,
    NvD3Module
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
