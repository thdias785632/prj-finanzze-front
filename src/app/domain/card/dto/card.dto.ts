export interface CardExpensses {
    id?: string;
    userId: string;
    cardId: string;
    referenceDate: Date;
    name: string;
    value: number;
    installments: number;
    installmentsActual?: number;
    active: boolean;
    category: string;
    recurrent: boolean;
}

export interface Card {
    id?: string;
    userId: string;
    name: string;
    active: boolean;
    flag: string;
}

export interface CardsExtract {
    card: Card;
    total: number;
    cardExpensess: CardExpensses[];
}