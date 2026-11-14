import { Itens, UserExtract } from '../domain/user/dto/user.dto';

export interface CategoryItem {
  name: string;
  value: number;                       // negativo = saída (usado só no detalhe da "Economia")
  kind: 'Cartão' | 'Fixa' | 'Entrada' | 'Saída';
  date?: Date | string;
  installments?: number;
  inactive?: boolean;
}

export type CategoryDetails = { [category: string]: CategoryItem[] };

/**
 * Lançamentos que compõem cada categoria do gráfico. Usa exatamente as mesmas listas e a mesma regra
 * (só entra quem tem categoria) do agrupamento de totais, para o detalhe sempre bater com a fatia.
 */
export function buildCategoryDetails(extract: UserExtract): CategoryDetails {
  const details: CategoryDetails = {};

  const add = (items: Itens[] | undefined, kind: 'Cartão' | 'Fixa') => {
    (items || []).forEach((item) => {
      if (!item.category) return;

      (details[item.category] ||= []).push({
        name: item.name,
        value: item.value,
        kind,
        date: item.referenceDate,
        installments: item.installments,
        inactive: !item.active,
      });
    });
  };

  add(extract.cardExpensess, 'Cartão');
  add(extract.fixedExpensess, 'Fixa');

  Object.values(details).forEach((items) => items.sort((a, b) => b.value - a.value));

  return details;
}
