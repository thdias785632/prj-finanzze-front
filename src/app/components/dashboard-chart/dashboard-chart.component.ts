import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CategoryDetails, CategoryItem } from '../../utils/category-details';

interface Segment {
  name: string;
  value: number;
  percent: number;
  color: string;
  start: number;      // posição inicial no anel (0-100)
  dash: number;       // comprimento visível do arco (0-100), com uma pequena folga entre fatias
  ux: number;         // vetor unitário do meio da fatia (para "respirar" para fora)
  uy: number;
}

// Paleta com cores bem distintas (a antiga repetia rosa ao passar de 10 categorias)
const PALETTE = [
  '#6639A6', '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#FF9F40',
  '#9D4EDD', '#8DD3C7', '#B3DE69', '#FDB462', '#C9CBCF', '#2E7D8F',
];

/**
 * Donut de categorias em SVG com animação:
 *  - entrada: cada fatia "desenha" o arco em sequência;
 *  - ociosa: cada fatia respira (afasta/aproxima do centro) com fases defasadas;
 *  - interação: passar o mouse destaca, clicar abre o detalhe da categoria sobre a lista.
 * A lista fica abaixo do gráfico e é também o caminho acessível por teclado/leitor de tela.
 */
@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-chart.component.html',
  styleUrls: ['./dashboard-chart.component.scss']
})
export class DashboardChartComponent implements OnChanges {
  @Input() data: { [key: string]: number } = {};
  @Input() details: CategoryDetails = {};

  @ViewChild('closeBtn') closeBtn?: ElementRef<HTMLButtonElement>;
  @ViewChildren('rowBtn') rowBtns!: QueryList<ElementRef<HTMLButtonElement>>;

  segments: Segment[] = [];
  total = 0;
  hovered: string | null = null;
  selected: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.build();

      if (this.selected && !this.segments.some((s) => s.name === this.selected)) this.selected = null;
    }
  }

  get selectedSegment(): Segment | undefined {
    return this.segments.find((s) => s.name === this.selected);
  }

  get selectedItems(): CategoryItem[] {
    return (this.selected && this.details?.[this.selected]) || [];
  }

  get focusName(): string | null {
    return this.selected || this.hovered;
  }

  get centerSegment(): Segment | undefined {
    return this.segments.find((s) => s.name === this.focusName);
  }

  trackByName(_: number, segment: Segment): string {
    return segment.name;
  }

  private colorFor(index: number): string {
    if (index < PALETTE.length) return PALETTE[index];

    // mais categorias que cores: gera tons distintos pelo "ângulo áureo"
    return `hsl(${Math.round((index * 137.508) % 360)}, 62%, 58%)`;
  }

  private build(): void {
    const entries = Object.entries(this.data || {}).filter(([, value]) => Number(value) > 0);

    this.total = entries.reduce((sum, [, value]) => sum + Number(value), 0);

    let cumulative = 0;

    this.segments = entries.map(([name, raw], index) => {
      const value = Number(raw);
      const percent = this.total > 0 ? (value / this.total) * 100 : 0;
      const gap = percent > 1.5 ? 0.6 : 0;
      const mid = ((cumulative + percent / 2) / 100) * 2 * Math.PI - Math.PI / 2;
      const segment: Segment = {
        name,
        value,
        percent,
        color: this.colorFor(index),
        start: cumulative + gap / 2,
        dash: Math.max(percent - gap, 0.15),
        ux: Math.round(Math.cos(mid) * 1000) / 1000,
        uy: Math.round(Math.sin(mid) * 1000) / 1000,
      };

      cumulative += percent;

      return segment;
    });
  }

  select(name: string): void {
    this.selected = name;
    this.hovered = null;
    setTimeout(() => this.closeBtn?.nativeElement.focus());
  }

  close(): void {
    const name = this.selected;

    this.selected = null;

    // devolve o foco para a linha da categoria que estava aberta
    setTimeout(() => {
      const index = this.segments.findIndex((s) => s.name === name);

      this.rowBtns?.toArray()[index]?.nativeElement.focus();
    });
  }
}
