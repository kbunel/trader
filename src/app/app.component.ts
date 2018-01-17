import { Component, ViewEncapsulation } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  constructor(private _electronService: ElectronService) {
  }

  private launchWindow() {
    this._electronService.shell.openExternal('https://coursetro.com');
  }
}
