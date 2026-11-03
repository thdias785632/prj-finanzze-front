export type FluxoTipo = 'ENTRADA' | 'MENSAIS' | 'INTERMEDIARIAS' | 'CHAVES' | 'FINANCIAMENTO' | 'OUTRO';
export type IndexType = 'INCC' | 'NONE';

export interface Parcela {
    id: string;
    imovelId: string;
    fluxoId: string;
    number: number;
    totalNumbers: number;
    dueDate: string;              // YYYY-MM-DD
    baseAmount: number;
    paid: boolean;
    paidAt?: string;
    paidAmount?: number;
    fluxoType: FluxoTipo;
    fluxoDescription: string;
    indexType: IndexType;
    referenceMonth?: string;      // YYYY-MM (mês do INCC usado)
    correctionFactor: number;
    correctedAmount: number;
    estimated: boolean;
    currentAmount: number;
    overdue: boolean;
}

export interface Fluxo {
    id: string;
    imovelId: string;
    type: FluxoTipo;
    description: string;
    installmentsCount: number;
    installmentAmount: number;
    firstDueDate: string;
    periodicityMonths: number;
    indexType: IndexType;
    parcelas: Parcela[];
    paidCount: number;
    totalPaid: number;
    totalRemaining: number;
}

export interface ImovelResumo {
    id: string;
    userId: string;
    name: string;
    developer?: string;
    address?: string;
    totalValue: number;
    contractDate: string;
    inccBaseMonth: string;        // YYYY-MM-01
    inccLagMonths: number;
    deliveryDate?: string;
    financingStartDate?: string;
    notes?: string;
    plannedTotal: number;
    totalPaid: number;
    totalRemaining: number;
    paidInstallments: number;
    totalInstallments: number;
    progressPercentage: number;
    financingAmount: number;
    overdueCount: number;
    nextInstallment?: Parcela;
    lastIndexMonth?: string;
}

export interface ImovelDetalhe {
    imovel: ImovelResumo;
    fluxos: Fluxo[];
}

export interface FluxoInput {
    type: FluxoTipo;
    description?: string;
    installmentsCount: number;
    installmentAmount: number;
    firstDueDate: string;
    periodicityMonths: number;
    indexType: IndexType;
}

export interface CreateImovelInput {
    userId: string;
    name: string;
    developer?: string;
    address?: string;
    totalValue: number;
    contractDate: string;
    inccBaseMonth: string;
    inccLagMonths: number;
    deliveryDate?: string;
    financingStartDate?: string;
    notes?: string;
    fluxos: FluxoInput[];
}

export interface UpdateImovelInput {
    id: string;
    userId: string;
    name?: string;
    developer?: string;
    address?: string;
    totalValue?: number;
    inccBaseMonth?: string;
    inccLagMonths?: number;
    deliveryDate?: string | null;
    financingStartDate?: string | null;
    notes?: string;
}

export const FLUXO_TIPOS: { value: FluxoTipo; label: string }[] = [
    { value: 'ENTRADA', label: 'Entrada / sinal' },
    { value: 'MENSAIS', label: 'Parcelas mensais' },
    { value: 'INTERMEDIARIAS', label: 'Intermediárias' },
    { value: 'CHAVES', label: 'Entrega das chaves' },
    { value: 'FINANCIAMENTO', label: 'Financiamento' },
    { value: 'OUTRO', label: 'Outro' },
];

export const PERIODICIDADES: { value: number; label: string }[] = [
    { value: 1, label: 'Mensal' },
    { value: 2, label: 'Bimestral' },
    { value: 3, label: 'Trimestral' },
    { value: 6, label: 'Semestral' },
    { value: 12, label: 'Anual' },
];
