import { Observable } from "rxjs";
import { CreateImovelInput, FluxoInput, ImovelDetalhe, ImovelResumo, UpdateImovelInput } from "../dto/imovel.dto";

export abstract class ImovelGateway {
    abstract create(input: CreateImovelInput): Observable<{ id: string }>;
    abstract getByUser(userId: string): Observable<ImovelResumo[]>;
    abstract getById(id: string, userId: string): Observable<ImovelDetalhe>;
    abstract update(input: UpdateImovelInput): Observable<void>;
    abstract delete(id: string, userId: string): Observable<void>;
    abstract addFluxo(imovelId: string, userId: string, fluxo: FluxoInput): Observable<{ id: string }>;
    abstract deleteFluxo(id: string, userId: string): Observable<void>;
    abstract payParcela(id: string, userId: string, paidAt?: string, paidAmount?: number): Observable<void>;
    abstract unpayParcela(id: string, userId: string): Observable<void>;
}
