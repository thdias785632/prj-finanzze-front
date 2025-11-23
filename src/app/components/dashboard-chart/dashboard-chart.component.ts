import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

// Register the Doughnut controller and required elements/plugins
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-chart.component.html',
  styleUrls: ['./dashboard-chart.component.scss']
})
export class DashboardChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: { [key: string]: number } = {};
  @ViewChild('doughnutCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      if (this.chart) {
        this.updateChart();
      } else if (this.canvas) {
        this.renderChart();
      }
    }
  }

  private renderChart(): void {
    if (!this.canvas) return;

    const ctx = this.canvas.nativeElement.getContext('2d');

    if (!ctx) return;

    const labels = Object.keys(this.data  || {});
    const values = Object.values(this.data || {});

    if (this.chart) {
      this.chart.destroy();
    }

    const currency = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: this.getColors(values.length),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        hover: {
          mode: 'nearest',
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => items && items.length ? String(items[0].label) : '',
              label: (context) => {
                const raw = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((Number(raw) || 0) / total * 100).toFixed(2);
                
                return `${currency(Number(raw) || 0)} (${percentage}%)`;
              }
            }
          },
          legend: {
            position: 'right',
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;
                if (!data.labels) return [];
                const ds = data.datasets && data.datasets[0];
                return (data.labels as string[]).map((label, i) => {
                  const v = ds && (ds.data as any)[i] ? Number((ds.data as any)[i]) : 0;
                  return {
                    text: `${label} — ${currency(v)}`,
                    fillStyle: ds && (ds.backgroundColor as any) ? (ds.backgroundColor as any)[i] : '#000',
                    hidden: false,
                    index: i
                  } as any;
                });
              }
            }
          }
        }
      },
    });
  }

  private updateChart(): void {
    if (!this.chart) {
      this.renderChart();
      return;
    }

    this.chart.data.labels = Object.keys(this.data || {});
    (this.chart.data.datasets as any) = [
      {
        data: Object.values(this.data || {}),
        backgroundColor: this.getColors(Object.keys(this.data || {}).length),
      },
    ];

    this.chart.update();
  }

  private getColors(n: number): string[] {
    const palette = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#C9CBCF',
      '#8DD3C7',
      '#FDB462',
      '#B3DE69',
    ];
    const colors: string[] = [];
    for (let i = 0; i < n; i++) {
      colors.push(palette[i % palette.length]);
    }
    return colors;
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
