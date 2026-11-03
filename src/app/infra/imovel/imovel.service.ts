import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ImovelGateway } from "../../domain/imovel/gateway/imovel.gateway";
import { CreateImovelInput, FluxoInput, ImovelDetalhe, ImovelResumo, UpdateImovelInput } from "../../domain/imovel/dto/imovel.dto";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ImovelService implements ImovelGateway {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  create(input: CreateImovelInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/imoveis`, input);
  }

  getByUser(userId: string): Observable<ImovelResumo[]> {
    return this.http.get<ImovelResumo[]>(`${this.apiUrl}/imoveis/get-by-user?userId=${userId}`);
  }

  getById(id: string, userId: string): Observable<ImovelDetalhe> {
    return this.http.get<ImovelDetalhe>(`${this.apiUrl}/imoveis/get-by-id?id=${id}&userId=${userId}`);
  }

  update(input: UpdateImovelInput): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/imoveis`, input);
  }

  delete(id: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/imoveis?id=${id}&userId=${userId}`);
  }

  addFluxo(imovelId: string, userId: string, fluxo: FluxoInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/imoveis/fluxos`, { ...fluxo, imovelId, userId });
  }

  deleteFluxo(id: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/imoveis/fluxos?id=${id}&userId=${userId}`);
  }

  payParcela(id: string, userId: string, paidAt?: string, paidAmount?: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/imoveis/parcelas/pay`, { id, userId, paidAt, paidAmount });
  }

  unpayParcela(id: string, userId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/imoveis/parcelas/unpay`, { id, userId });
  }
}
