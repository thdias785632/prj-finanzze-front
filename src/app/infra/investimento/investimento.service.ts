import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { InvestimentoGateway } from "../../domain/investimento/gateway/investimento.gateway";
import { CategoriaInvestimento, Investimento } from "../../domain/investimento/dto/investimento.dto";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class InvestimentoService implements InvestimentoGateway {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpServer: HttpClient
  ) { }

  createCategoria(categoria: CategoriaInvestimento): Observable<void> {
    return this.httpServer.post<void>(`${this.apiUrl}/categoria-investimento`, categoria);
  }

  getCategoriasByUserId(userId: string): Observable<CategoriaInvestimento[]> {
    return this.httpServer.get<CategoriaInvestimento[]>(`${this.apiUrl}/categoria-investimento/get-by-user?userId=${userId}`);
  }

  deleteCategoria(id: string): Observable<void> {
    return this.httpServer.delete<void>(`${this.apiUrl}/categoria-investimento/?id=${id}`);
  }

  createInvestimento(investimento: Investimento): Observable<void> {
    return this.httpServer.post<void>(`${this.apiUrl}/investimento`, investimento);
  }

  getInvestimentosByUserId(userId: string): Observable<Investimento[]> {
    return this.httpServer.get<Investimento[]>(`${this.apiUrl}/investimento/get-by-user?userId=${userId}`);
  }

  updateInvestimento(investimento: Investimento): Observable<void> {
    return this.httpServer.put<void>(`${this.apiUrl}/investimento`, investimento);
  }

  deleteInvestimento(id: string): Observable<void> {
    return this.httpServer.delete<void>(`${this.apiUrl}/investimento/?id=${id}`);
  }
}
