import { Directive, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SortService } from '@services/sort.service';

@Directive({
  selector: '[sortable-table]'
})
export class SortDirective implements OnInit, OnDestroy {

  constructor(private sortService: SortService) {
  }

  @Output() public sorted = new EventEmitter();

  private columnSortedSubscription: Subscription;

  public ngOnInit() {
    this.columnSortedSubscription = this.sortService.columnSorted$.subscribe(event => {
      this.sorted.emit(event);
    });
  }

  public ngOnDestroy() {
    this.columnSortedSubscription.unsubscribe();
  }
}
