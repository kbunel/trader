import { Component, OnInit, Input, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SortService } from '@services/sort.service';

@Component({
  selector: '[app-sortable-column]',
  templateUrl: './sortable-column.component.html'
})
export class SortableColumnComponent implements OnInit, OnDestroy {

  constructor(private sortService: SortService) {
  }

  @Input('app-sortable-column') public columnName: string = '';

  @Input('app-sort-direction') public sortDirection: string = '';

  private columnSortedSubscription: Subscription;

  @HostListener('click')
  public sort() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortService.columnSorted({
      sortColumn: this.columnName,
      sortDirection: this.sortDirection
    });
  }

  public ngOnInit() {
    this.columnSortedSubscription = this.sortService.columnSorted$.subscribe(event => {
      if (this.columnName !== event.sortColumn) {
        this.sortDirection = '';
      }
    });
  }

  public ngOnDestroy() {
    this.columnSortedSubscription.unsubscribe();
  }
}
