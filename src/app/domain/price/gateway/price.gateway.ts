import { Observable } from 'rxjs';
import { CotacaoAtual } from '../dto/price.dto';

export abstract class PriceGateway {
    abstract getPrice(ticker: string): Observable<CotacaoAtual | null>;
    abstract getPrices(tickers: string[]): Observable<Record<string, CotacaoAtual | null>>;
    abstract getBrapiToken(): string | null;
    abstract setBrapiToken(token: string | null): void;
}
