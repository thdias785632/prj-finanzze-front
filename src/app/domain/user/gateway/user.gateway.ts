import { Observable } from "rxjs";
import { Expensses, Login, Revenue, User, UserExtract } from "../dto/user.dto";
import { HttpEvent } from "@angular/common/http";

export abstract class UserGateway {
    abstract login(data: Login): Observable<User>;
    abstract setUser(user: User): void;
    abstract getUser(): User | null;
    abstract getUserExtract(userId: string, date: string): Observable<UserExtract>;
    abstract createRevenue(revenue: Revenue): Observable<void>;
    abstract deleteRevenue(id: string): Observable<void>;
    abstract createExpensses(expensses: Expensses): Observable<void>;
    abstract deleteExpensses(id: string): Observable<void>;
    abstract sendExtract(email: string): Observable<void>;
}