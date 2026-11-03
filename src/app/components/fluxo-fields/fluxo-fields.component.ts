import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FLUXO_TIPOS, FluxoTipo, PERIODICIDADES } from '../../domain/imovel/dto/imovel.dto';

interface Preset { description: string; count: number; periodicity: number; indexType: 'INCC' | 'NONE'; }

const PRESETS: Record<FluxoTipo, Preset> = {
  ENTRADA: { description: 'Entrada / sinal', count: 1, periodicity: 1, indexType: 'INCC' },
  MENSAIS: { description: 'Parcelas mensais', count: 36, periodicity: 1, indexType: 'INCC' },
  INTERMEDIARIAS: { description: 'Intermediárias', count: 3, periodicity: 12, indexType: 'INCC' },
  CHAVES: { description: 'Entrega das chaves', count: 1, periodicity: 1, indexType: 'INCC' },
  FINANCIAMENTO: { description: 'Financiamento', count: 120, periodicity: 1, indexType: 'NONE' },
  OUTRO: { description: '', count: 1, periodicity: 1, indexType: 'INCC' },
};

/** Cria o FormGroup de um fluxo de pagamento já com os valores padrão do tipo. */
export function buildFluxoGroup(fb: FormBuilder, type: FluxoTipo = 'MENSAIS'): FormGroup {
  const preset = PRESETS[type];

  return fb.group({
    type: [type, Validators.required],
    description: [preset.description],
    installmentsCount: [preset.count, [Validators.required, Validators.min(1), Validators.max(600)]],
    installmentAmount: [null, [Validators.required, Validators.min(0.01)]],
    firstDueDate: ['', Validators.required],
    periodicityMonths: [preset.periodicity, Validators.required],
    indexType: [preset.indexType, Validators.required],
  });
}

@Component({
  selector: 'app-fluxo-fields',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="fluxo-fields" [formGroup]="group">
      <mat-form-field appearance="outline">
        <mat-label>Tipo de pagamento</mat-label>
        <mat-select formControlName="type" (selectionChange)="applyPreset()">
          <mat-option *ngFor="let t of tipos" [value]="t.value">{{ t.label }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Descrição</mat-label>
        <input matInput formControlName="description" autocomplete="off" />
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>Nº de parcelas</mat-label>
          <input matInput type="number" inputmode="numeric" step="1" min="1" formControlName="installmentsCount" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Valor da parcela (R$)</mat-label>
          <input matInput type="number" inputmode="decimal" step="any" min="0" formControlName="installmentAmount" autocomplete="off" />
          <mat-hint>Valor-base, antes da correção</mat-hint>
        </mat-form-field>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline">
          <mat-label>1º vencimento</mat-label>
          <input matInput type="date" formControlName="firstDueDate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Periodicidade</mat-label>
          <mat-select formControlName="periodicityMonths">
            <mat-option *ngFor="let p of periodicidades" [value]="p.value">{{ p.label }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Correção</mat-label>
        <mat-select formControlName="indexType">
          <mat-option value="INCC">Corrigir pelo INCC</mat-option>
          <mat-option value="NONE">Sem correção (valor fixo)</mat-option>
        </mat-select>
      </mat-form-field>

      <p class="fluxo-total" *ngIf="total > 0">
        Total do fluxo (sem correção): <strong>R$ {{ total | number: '1.2-2' }}</strong>
      </p>
    </div>
  `,
  styles: [`
    .fluxo-fields { display: block; }
    mat-form-field { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fluxo-total { margin: 0 0 8px; color: #52678F; font-size: 14px; }
    .fluxo-total strong { color: #4A1F7A; }
  `]
})
export class FluxoFieldsComponent {
  @Input({ required: true }) group!: FormGroup;

  tipos = FLUXO_TIPOS;
  periodicidades = PERIODICIDADES;

  get total(): number {
    const count = Number(this.group?.get('installmentsCount')?.value) || 0;
    const amount = Number(this.group?.get('installmentAmount')?.value) || 0;

    return count * amount;
  }

  applyPreset(): void {
    const preset = PRESETS[this.group.get('type')?.value as FluxoTipo];

    this.group.patchValue({
      description: preset.description,
      installmentsCount: preset.count,
      periodicityMonths: preset.periodicity,
      indexType: preset.indexType,
    });
  }
}
