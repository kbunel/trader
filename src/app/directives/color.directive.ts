import { Directive, ElementRef, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[appColor]'
})
export class ColorDirective implements OnInit {

  @Input('appColor') public appColor: string = '';

  constructor(private el: ElementRef) {
  }

  public ngOnInit() {
    if (typeof this.appColor !== 'undefined' && (this.appColor.indexOf('-') !== -1 || Number(this.appColor) < 0)) {
      this.el.nativeElement.classList.add('magenta');
    } else {
      this.el.nativeElement.classList.add('green');
    }
  }
}
