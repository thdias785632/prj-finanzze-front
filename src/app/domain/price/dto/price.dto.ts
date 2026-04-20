export interface CotacaoAtual {
    ticker: string;
    price: number;
    source: 'brapi' | 'coingecko';
    currency?: string;
}

export interface AtualizacaoPrecoResultado {
    atualizados: number;
    falharam: string[];
}
