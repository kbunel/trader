import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SortService {

  private columnSortedSource = new Subject<ColumnSortedEvent>();

  public columnSorted$ = this.columnSortedSource.asObservable();

  public columnSorted(event: ColumnSortedEvent) {
    this.columnSortedSource.next(event);
  }
}

export interface ColumnSortedEvent {
  sortColumn: string;
  sortDirection: string;
}
