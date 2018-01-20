import { Directive, ElementRef, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[appColor]'
})
export class ColorDirective implements OnInit {

  @Input('appColor') public appColor: string = '';

  constructor(private el: ElementRef) {
  }

  public ngOnInit() {
    if (this.appColor.indexOf('-') !== -1) {
      this.el.nativeElement.classList.add('magenta');
    } else {
      this.el.nativeElement.classList.add('green');
    }
  }
}
