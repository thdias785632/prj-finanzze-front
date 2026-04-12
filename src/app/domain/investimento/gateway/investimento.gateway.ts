import { Observable } from "rxjs";
import { CategoriaInvestimento, Investimento } from "../dto/investimento.dto";

export abstract class InvestimentoGateway {
    abstract createCategoria(categoria: CategoriaInvestimento): Observable<void>;
    abstract getCategoriasByUserId(userId: string): Observable<CategoriaInvestimento[]>;
    abstract deleteCategoria(id: string): Observable<void>;

    abstract createInvestimento(investimento: Investimento): Observable<void>;
    abstract getInvestimentosByUserId(userId: string): Observable<Investimento[]>;
    abstract updateInvestimento(investimento: Investimento): Observable<void>;
    abstract deleteInvestimento(id: string): Observable<void>;
}
