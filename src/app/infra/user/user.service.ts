import { HttpClient, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from '../../../environments/environment';
import { UserGateway } from "../../domain/user/gateway/user.gateway";
import { Login, User, UserExtract } from "../../domain/user/dto/user.dto";

@Injectable({
  providedIn: 'root'
})
export class UserService implements UserGateway {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpServer: HttpClient
  ) { }

  login({
    email,
    password
  }: Login): Observable<User> {
    const data = {
      email,
      password
    };
    
    return this.httpServer.post<User>(
        `${this.apiUrl}/user/login`, data
    );
  }

  setUser(user: User): void {
    localStorage.setItem('@Finnanze:User', JSON.stringify(user));
  }

  getUser(): User | null {
    const user = localStorage.getItem('@Finnanze:User');
   
    return user ? JSON.parse(user) : null;
  }

  getUserExtract(userId: string, date: string): Observable<UserExtract> {
    return this.httpServer.get<UserExtract>(
      `${this.apiUrl}/extract/complete-extract?userId=${userId}&month=${date}`
    );
  }

  createRevenue(revenue: any): Observable<void> {
    return this.httpServer.post<void>(
      `${this.apiUrl}/revenues`, revenue
    );
  }

  deleteRevenue(id: string): Observable<void> {
    return this.httpServer.delete<void>(
      `${this.apiUrl}/revenues?id=${id}`, {});
  }

  createExpensses(expenses: any): Observable<void> {
    return this.httpServer.post<void>(
      `${this.apiUrl}/expensses`, expenses
    );
  }

  deleteExpensses(id: string): Observable<void> {
    return this.httpServer.delete<void>(
      `${this.apiUrl}/expensses?id=${id}`, {});
  }

  sendExtract(email: string): Observable<void> {
    return this.httpServer.get<void>(
      `${this.apiUrl}/extract/send-extract?email=${email}`, {});
  }
}