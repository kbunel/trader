import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '@services/webSocket.service';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.scss']
})
export class ServerComponent implements OnInit {

  constructor(public webSocketService: WebSocketService) { }

  ngOnInit() {
  }

}
