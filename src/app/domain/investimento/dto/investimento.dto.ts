export interface CategoriaInvestimento {
    id?: string;
    userId?: string;
    name: string;
    targetPercentage: number;
    createdAt?: Date;
}

export interface Investimento {
    id?: string;
    userId?: string;
    categoriaId: string;
    name: string;
    currentValue: number;
    targetPercentage: number;
    quantity?: number;
    averagePrice?: number;
    currentPrice?: number;
    createdAt?: Date;
}

export interface InvestimentoComCalculo extends Investimento {
    percentualNaCategoria: number;
    percentualNaCarteira: number;
    // Valorização
    totalInvestido?: number;       // quantity * averagePrice
    valorAtual?: number;           // quantity * currentPrice (= currentValue se preenchido)
    ganhoLoss?: number;            // valorAtual - totalInvestido
    valorizacaoPct?: number;       // ((currentPrice - averagePrice) / averagePrice) * 100
}

export interface CategoriaComCalculo extends CategoriaInvestimento {
    ativos: InvestimentoComCalculo[];
    totalCategoria: number;
    percentualNaCarteira: number;
}

export interface AporteRecomendacao {
    categoriaId: string;
    categoriaNome: string;
    valorRecomendado: number;
    ativos: {
        ativoId: string;
        ativoNome: string;
        valorRecomendado: number;
        quantidadeRecomendada?: number; // valorRecomendado / currentPrice
        currentPrice?: number;
    }[];
}
