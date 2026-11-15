export type BeltPhase = 'circle' | 'focus' | 'diagonal' | 'belt';

export interface BeltCard {
  id: string;
  code: string;
  label: string;
  image: string;
  accent: string;
}

export const BELT_CARDS: BeltCard[] = [
  { id: 'a', code: '0034', label: 'RESUMO',  image: 'assets/belt/imagem-a.png', accent: '#7A45BF' },
  { id: 'b', code: '0095', label: 'EXTRATO', image: 'assets/belt/imagem-b.png', accent: '#4A1F7A' },
  { id: 'c', code: '0316', label: 'GRÁFICO', image: 'assets/belt/imagem-c.png', accent: '#9D4EDD' },
  { id: 'd', code: '2026', label: 'CATEGORIAS', image: 'assets/belt/imagem-d.png', accent: '#5E4B8B' },
  { id: 'e', code: '0084', label: 'GASTOS',   image: 'assets/belt/imagem-e.png', accent: '#6639A6' }
];

export const PHASE_DURATION = {
  circle: 3200,
  focus: 3000,
  diagonal: 3000,
  belt: 3400
} as const;

export const PHASE_ORDER: BeltPhase[] = ['circle', 'focus', 'diagonal', 'belt'];