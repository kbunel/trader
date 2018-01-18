import { Component, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '@services/webSocket.service';
import { environment } from '@env/environment';
import { AmChartsService, AmChart } from '@amcharts/amcharts3-angular';

@Component({
  selector: 'graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GraphComponent implements OnInit, AfterViewInit, OnDestroy {
  private chart: AmChart;

  constructor(private AmCharts: AmChartsService,
              private http: HttpClient,
              public webSocketService: WebSocketService) {
  }

  public ngAfterViewInit() {
    this.chart = this.AmCharts.makeChart('chartdiv', {
      type: 'stock',
      theme: 'dark',
      dataSets: [{
        title: 'XXXXXX',
        fieldMappings: [{
          fromField: 'adjusted',
          toField: 'adjusted'
        }, {
          fromField: 'open',
          toField: 'open'
        }, {
          fromField: 'high',
          toField: 'high'
        }, {
          fromField: 'low',
          toField: 'low'
        }, {
          fromField: 'close',
          toField: 'close'
        }, {
          fromField: 'volume',
          toField: 'volume'
        }],
        compared: false,
        categoryField: 'openTime',
        dataLoader: {
          url: environment.url.api + '/klines',
          format: 'json',
          async: true
        }
      }],
      dataDateFormat: 'YYYY-MM-DD hh:mm',
      panels: [{
        title: 'Value',
        percentHeight: 70,
        stockGraphs: [{
          type: 'candlestick',
          id: 'g1',
          openField: 'open',
          closeField: 'close',
          highField: 'high',
          lowField: 'low',
          valueField: 'close',
          lineColor: '#fff',
          fillColors: '#fff',
          negativeLineColor: '#db4c3c',
          negativeFillColors: '#db4c3c',
          fillAlphas: 1,
          comparedGraphLineThickness: 2,
          columnWidth: 0.7,
          useDataSetColors: false,
          comparable: true,
          compareField: 'close',
          showBalloon: false,
          proCandlesticks: true
        }],
        stockLegend: {
          valueTextRegular: undefined,
          periodValueTextComparing: '[[percents.value.close]]%'
        }
      }, {
        title: 'Volume',
        percentHeight: 30,
        marginTop: 1,
        columnWidth: 0.6,
        showCategoryAxis: false,
        stockGraphs: [{
          valueField: 'volume',
          openField: 'open',
          type: 'column',
          showBalloon: false,
          fillAlphas: 1,
          lineColor: '#fff',
          fillColors: '#fff',
          negativeLineColor: '#db4c3c',
          negativeFillColors: '#db4c3c',
          useDataSetColors: false
        }],
        stockLegend: {
          markerType: 'none',
          markerSize: 0,
          labelText: '',
          periodValueTextRegular: '[[value.close]]'
        },
        valueAxes: [{
          usePrefixes: true
        }]
      }],
      panelsSettings: {
        plotAreaFillColors: '#333',
        plotAreaFillAlphas: 1,
        marginLeft: 60,
        marginTop: 5,
        marginBottom: 5
      },
      chartScrollbarSettings: {
        graph: 'g1',
        graphType: 'line',
        usePeriod: 'WW',
        backgroundColor: '#333',
        graphFillColor: '#666',
        graphFillAlpha: 0.5,
        gridColor: '#555',
        gridAlpha: 1,
        selectedBackgroundColor: '#444',
        selectedGraphFillAlpha: 1
      },
      categoryAxesSettings: {
        equalSpacing: true,
        gridColor: '#555',
        gridAlpha: 1
      },
      valueAxesSettings: {
        gridColor: '#555',
        gridAlpha: 1,
        inside: false,
        showLastLabel: true
      },
      chartCursorSettings: {
        pan: true,
        valueLineEnabled: true,
        valueLineBalloonEnabled: true
      },
      legendSettings: {
        color: '#fff'
      },
      stockEventsSettings: {
        showAt: 'high',
        type: 'pin'
      },
      balloon: {
        textAlign: 'left',
        offsetY: 10
      }
    });
  }

  public ngOnDestroy() {
    if (this.chart) {
      this.AmCharts.destroyChart(this.chart);
    }
  }

  public dataSet(): any {
    this.http.get(environment.url.api + '/klines/1m')
      .subscribe((data: any) => {
        this.AmCharts.updateChart(this.chart, () => {
          console.log(this.chart);
          this.chart.currentPeriod = 'mm';
          this.chart.dataSets[0].dataProvider = data;
        });
      });
  }

  public ngOnInit(): void {
    this.webSocketService.frontSubscribe.subscribe(console.log);
  }
}
