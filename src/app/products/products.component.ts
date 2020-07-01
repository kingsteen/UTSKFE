import {Component, ViewChild, AfterViewInit, OnInit} from '@angular/core';
import { environment } from 'src/environments/environment';
import {HttpClient} from '@angular/common/http';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import { CloseScrollStrategy } from '@angular/cdk/overlay';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements AfterViewInit{

  displayedColumns: string[] = ['id', 'name', 'description', 'value', 'currency', 'type', 'department', 'weight'];
  database: ProductData | null;
  data: ProductApi[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _httpClient: HttpClient) {}

  ngAfterViewInit() {
    this.database = new ProductData(this._httpClient);

    // If the user changes the sort order, reset back to the first page.
    // this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.database!.getProducts(
            this.sort.active, this.sort.direction, this.paginator.pageIndex);
        }),
        map(data => {
          console.log(data['data']);
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data['total'];

          return data['data'];
        }),
        catchError(() => {
          this.isLoadingResults = false;
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe(data => this.data = data);
  }
}

export interface ProductApi {
  items: ProductList[];
  total_count: number;
}

export interface ProductList {
  id: number;
  name: string;
  description: string;
  price: {
    value: number;
    currency: string;
  };
  type: string;
  value: number;
  currency: number;
  weight: number
}

/** An example database that the data source uses to retrieve data for the table. */
export class ProductData {
  constructor(private _httpClient: HttpClient) {}

  getProducts(sort: string, order: string, page: number): Observable<ProductApi[]> {
    const href = environment.apiUrl + 'get-products';
    // const href = environment.testUrl + 'get-products';
    console.log(href)
    // const requestUrl =
    //     `${href}?q=repo:angular/components&sort=${sort}&order=${order}&page=${page + 1}`;

    return this._httpClient.get<ProductApi[]>(href);
  }
}
