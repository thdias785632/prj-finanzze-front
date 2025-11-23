export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Login {
    email: string;
    password: string;
}

export interface CreateUser {
    name: string;
    email: string;
    password: string;
}

export interface UserExtract {
    totalExpensess: number;
    totalRevenues: number;
    totalCardExpensess: number;
    revenues: Itens[];
    cardExpensess: Itens[];
    fixedExpensess: Itens[];
}

export interface Itens {
    id: string;
    name: string;
    value: number;
    category?: string
}

export interface Revenue {
    userId: string;
    referenceDate: Date;
    name: string;
    value: number;
    active: boolean;
    recurrent: boolean;
}

export interface Expensses extends Revenue {
    category: string;
}