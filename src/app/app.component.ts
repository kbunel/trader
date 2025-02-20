import { Component, ViewEncapsulation } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  public tab: number = 0;

  constructor(private _electronService: ElectronService) {
  }

  /*private launchWindow() {
    this._electronService.shell.openExternal('https://coursetro.com');
  }*/
}
