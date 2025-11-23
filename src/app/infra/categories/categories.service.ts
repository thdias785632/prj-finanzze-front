import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CategoriesGateway } from "../../domain/categories/gateway/categories.gateway";
import { Categories } from "../../domain/categories/dto/categories.dto";

@Injectable({
  providedIn: 'root'
})
export class CategoriesService implements CategoriesGateway {
  private apiUrl = "http://192.168.0.153:3000/api";

  constructor(
    private httpServer: HttpClient
  ) { }

  createCategory(category: Categories): Observable<void> {
    return this.httpServer.post<void>(
      `${this.apiUrl}/categories`, category
    );
  }

  getCategoriesByUserId(userId: string): Observable<Categories[]> {
    return this.httpServer.get<Categories[]>(
      `${this.apiUrl}/categories/get-by-user?userId=${userId}`
    );
  }
}