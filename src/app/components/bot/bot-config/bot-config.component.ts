import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '@services/webSocket.service';

@Component({
  selector: 'app-bot-config',
  templateUrl: './bot-config.component.html',
  styleUrls: ['./bot-config.component.scss']
})
export class BotConfigComponent implements OnInit {

  constructor(public webSocketService: WebSocketService) {
  }

  ngOnInit() {
  }

}
