import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PriceGateway } from '../../domain/price/gateway/price.gateway';
import { CotacaoAtual } from '../../domain/price/dto/price.dto';

const BRAPI_BASE = 'https://brapi.dev/api';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BRAPI_TOKEN_STORAGE_KEY = '@Finnanze:BrapiToken';

// Tickers que a brapi disponibiliza sem token (acesso gratuito)
const BRAPI_FREE_TICKERS = new Set(['PETR4', 'MGLU3', 'VALE3', 'ITUB4']);

// Mapa de s\u00edmbolos de cripto para IDs da CoinGecko
const CRYPTO_SYMBOL_TO_ID: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    SOL: 'solana',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    POL: 'matic-network',
    LINK: 'chainlink',
    AVAX: 'avalanche-2',
    LTC: 'litecoin',
    BCH: 'bitcoin-cash',
    UNI: 'uniswap',
    ATOM: 'cosmos',
    XLM: 'stellar',
    TRX: 'tron',
    NEAR: 'near',
    APT: 'aptos',
    ARB: 'arbitrum',
    OP: 'optimism',
    PEPE: 'pepe',
    SHIB: 'shiba-inu',
};

interface BrapiResponse {
    results?: Array<{
        symbol: string;
        regularMarketPrice?: number;
        currency?: string;
        error?: string;
    }>;
    error?: string;
    message?: string;
}

@Injectable({ providedIn: 'root' })
export class PriceService implements PriceGateway {
    constructor(private http: HttpClient) {}

    getBrapiToken(): string | null {
        try {
            return localStorage.getItem(BRAPI_TOKEN_STORAGE_KEY);
        } catch {
            return null;
        }
    }

    setBrapiToken(token: string | null): void {
        try {
            if (token && token.trim()) {
                localStorage.setItem(BRAPI_TOKEN_STORAGE_KEY, token.trim());
            } else {
                localStorage.removeItem(BRAPI_TOKEN_STORAGE_KEY);
            }
        } catch {
            // ignora
        }
    }

    getPrice(ticker: string): Observable<CotacaoAtual | null> {
        const normalized = this.normalizeTicker(ticker);
        if (!normalized) return of(null);

        if (this.isCrypto(normalized)) {
            return this.fetchCrypto(normalized);
        }

        return this.fetchBrapi(normalized);
    }

    getPrices(tickers: string[]): Observable<Record<string, CotacaoAtual | null>> {
        const unique = Array.from(new Set(tickers.map((t) => this.normalizeTicker(t)).filter(Boolean))) as string[];
        if (unique.length === 0) return of({});

        const cryptoSymbols: string[] = [];
        const brapiSymbols: string[] = [];
        for (const t of unique) {
            if (this.isCrypto(t)) {
                cryptoSymbols.push(t);
            } else {
                brapiSymbols.push(t);
            }
        }

        const requests: Array<Observable<Record<string, CotacaoAtual | null>>> = [];

        if (cryptoSymbols.length > 0) {
            requests.push(this.fetchCryptoBatch(cryptoSymbols));
        }

        if (brapiSymbols.length > 0) {
            requests.push(this.fetchBrapiBatch(brapiSymbols));
        }

        if (requests.length === 0) return of({});

        return forkJoin(requests).pipe(
            map((parts) => {
                const merged: Record<string, CotacaoAtual | null> = {};
                for (const p of parts) Object.assign(merged, p);
                for (const t of unique) {
                    if (!(t in merged)) merged[t] = null;
                }
                return merged;
            }),
        );
    }

    private normalizeTicker(ticker: string | undefined | null): string {
        if (!ticker) return '';
        return ticker
            .toString()
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '');
    }

    private isCrypto(tickerUpper: string): boolean {
        return tickerUpper in CRYPTO_SYMBOL_TO_ID;
    }

    private fetchBrapi(ticker: string): Observable<CotacaoAtual | null> {
        const token = this.getBrapiToken();
        const url = `${BRAPI_BASE}/quote/${encodeURIComponent(ticker)}`;
        const params: Record<string, string> = {};
        if (token) params['token'] = token;
        // Se n\u00e3o houver token e o ticker n\u00e3o for free, evita a chamada
        if (!token && !BRAPI_FREE_TICKERS.has(ticker)) {
            return of(null);
        }

        return this.http.get<BrapiResponse>(url, { params }).pipe(
            map((res) => {
                const first = res?.results?.[0];
                if (!first || typeof first.regularMarketPrice !== 'number') return null;
                return {
                    ticker,
                    price: first.regularMarketPrice,
                    source: 'brapi' as const,
                    currency: first.currency,
                };
            }),
            catchError((_err: HttpErrorResponse) => of(null)),
        );
    }

    private fetchBrapiBatch(tickers: string[]): Observable<Record<string, CotacaoAtual | null>> {
        const token = this.getBrapiToken();
        const allowed = token ? tickers : tickers.filter((t) => BRAPI_FREE_TICKERS.has(t));
        const skipped = token ? [] : tickers.filter((t) => !BRAPI_FREE_TICKERS.has(t));

        const base: Record<string, CotacaoAtual | null> = {};
        for (const t of skipped) base[t] = null;

        if (allowed.length === 0) return of(base);

        const url = `${BRAPI_BASE}/quote/${allowed.map(encodeURIComponent).join(',')}`;
        const params: Record<string, string> = {};
        if (token) params['token'] = token;

        return this.http.get<BrapiResponse>(url, { params }).pipe(
            map((res) => {
                const out: Record<string, CotacaoAtual | null> = { ...base };
                const results = res?.results ?? [];
                const bySymbol = new Map<string, (typeof results)[number]>();
                for (const r of results) bySymbol.set(r.symbol?.toUpperCase?.() ?? '', r);

                for (const t of allowed) {
                    const r = bySymbol.get(t);
                    if (r && typeof r.regularMarketPrice === 'number') {
                        out[t] = {
                            ticker: t,
                            price: r.regularMarketPrice,
                            source: 'brapi',
                            currency: r.currency,
                        };
                    } else {
                        out[t] = null;
                    }
                }
                return out;
            }),
            catchError(() => {
                const out: Record<string, CotacaoAtual | null> = { ...base };
                for (const t of allowed) out[t] = null;
                return of(out);
            }),
        );
    }

    private fetchCrypto(symbol: string): Observable<CotacaoAtual | null> {
        const id = CRYPTO_SYMBOL_TO_ID[symbol];
        if (!id) return of(null);
        const url = `${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=brl`;
        return this.http.get<Record<string, { brl?: number }>>(url).pipe(
            map((res) => {
                const price = res?.[id]?.brl;
                if (typeof price !== 'number') return null;
                return { ticker: symbol, price, source: 'coingecko' as const, currency: 'BRL' };
            }),
            catchError(() => of(null)),
        );
    }

    private fetchCryptoBatch(symbols: string[]): Observable<Record<string, CotacaoAtual | null>> {
        const validSymbols = symbols.filter((s) => s in CRYPTO_SYMBOL_TO_ID);
        const missing = symbols.filter((s) => !(s in CRYPTO_SYMBOL_TO_ID));

        const base: Record<string, CotacaoAtual | null> = {};
        for (const s of missing) base[s] = null;

        if (validSymbols.length === 0) return of(base);

        const idToSymbol = new Map<string, string>();
        for (const s of validSymbols) idToSymbol.set(CRYPTO_SYMBOL_TO_ID[s], s);

        const idsParam = Array.from(idToSymbol.keys()).map(encodeURIComponent).join(',');
        const url = `${COINGECKO_BASE}/simple/price?ids=${idsParam}&vs_currencies=brl`;

        return this.http.get<Record<string, { brl?: number }>>(url).pipe(
            map((res) => {
                const out: Record<string, CotacaoAtual | null> = { ...base };
                for (const s of validSymbols) out[s] = null;
                if (!res) return out;

                for (const [id, sym] of idToSymbol.entries()) {
                    const price = res?.[id]?.brl;
                    if (typeof price === 'number') {
                        out[sym] = { ticker: sym, price, source: 'coingecko', currency: 'BRL' };
                    }
                }
                return out;
            }),
            catchError(() => {
                const out: Record<string, CotacaoAtual | null> = { ...base };
                for (const s of validSymbols) out[s] = null;
                return of(out);
            }),
        );
    }
}
