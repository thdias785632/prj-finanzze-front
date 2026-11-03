import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { FluxoFieldsComponent, buildFluxoGroup } from '../../components/fluxo-fields/fluxo-fields.component';
import { LoaderComponent } from '../../components/loader/loader.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { ModalDirective } from '../../directives/modal.directive';
import { CreateImovelInput, FLUXO_TIPOS, FluxoTipo, ImovelResumo } from '../../domain/imovel/dto/imovel.dto';
import { ImovelGateway } from '../../domain/imovel/gateway/imovel.gateway';
import { User } from '../../domain/user/dto/user.dto';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { ImovelService } from '../../infra/imovel/imovel.service';
import { NotificationService } from '../../infra/notification/notification.service';
import { UserService } from '../../infra/user/user.service';

@Component({
  selector: 'app-imoveis',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatButtonModule, ModalDirective, LoaderComponent, NotificationComponent, FluxoFieldsComponent,
  ],
  templateUrl: './imoveis.component.html',
  styleUrls: ['./imoveis.component.scss'],
  providers: [
    { provide: UserGateway, useClass: UserService },
    { provide: ImovelGateway, useClass: ImovelService },
    { provide: NotificationService, useClass: NotificationService },
  ]
})
export class ImoveisComponent implements OnInit {
  user: User | null = null;
  isLoading = false;
  imoveis: ImovelResumo[] = [];

  showModal = false;
  step: 1 | 2 = 1;
  saving = false;
  baseMonthTouched = false;

  form!: FormGroup;
  lagOptions = [0, 1, 2, 3, 4, 5, 6];
  quickTypes = FLUXO_TIPOS.filter((t) => t.value !== 'OUTRO');

  constructor(
    private fb: FormBuilder,
    private userService: UserGateway,
    private imovelService: ImovelGateway,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.user = this.userService.getUser();
    this.buildForm();
    this.load();
  }

  get fluxos(): FormArray {
    return this.form.get('fluxos') as FormArray;
  }

  get fluxoGroups(): FormGroup[] {
    return this.fluxos.controls as FormGroup[];
  }

  get plannedTotal(): number {
    return this.fluxoGroups.reduce((sum, g) => sum + (Number(g.value.installmentsCount) || 0) * (Number(g.value.installmentAmount) || 0), 0);
  }

  get totalPaid(): number { return this.imoveis.reduce((s, i) => s + i.totalPaid, 0); }
  get totalRemaining(): number { return this.imoveis.reduce((s, i) => s + i.totalRemaining, 0); }
  get overdueCount(): number { return this.imoveis.reduce((s, i) => s + i.overdueCount, 0); }

  buildForm(): void {
    this.form = this.fb.group({
      name: new FormControl('', [Validators.required]),
      developer: new FormControl(''),
      totalValue: new FormControl(null, [Validators.required, Validators.min(0)]),
      contractDate: new FormControl('', [Validators.required]),
      inccBaseMonth: new FormControl('', [Validators.required]),
      inccLagMonths: new FormControl(2, [Validators.required]),
      deliveryDate: new FormControl(''),
      financingStartDate: new FormControl(''),
      fluxos: this.fb.array([]),
    });

    // mês-base do INCC acompanha o mês do contrato até o usuário alterar manualmente
    this.form.get('contractDate')?.valueChanges.subscribe((date: string) => {
      if (!this.baseMonthTouched && date) this.form.get('inccBaseMonth')?.setValue(date.slice(0, 7), { emitEvent: false });
    });
  }

  load(): void {
    if (!this.user) return;

    this.isLoading = true;

    this.imovelService.getByUser(this.user.id).subscribe({
      next: (imoveis) => { this.imoveis = imoveis; this.isLoading = false; },
      error: () => { this.isLoading = false; this.notificationService.showMessage('Erro ao carregar imóveis', 'error'); },
    });
  }

  openModal(): void {
    this.buildForm();
    this.baseMonthTouched = false;
    this.step = 1;
    this.fluxos.push(buildFluxoGroup(this.fb, 'ENTRADA'));
    this.fluxos.push(buildFluxoGroup(this.fb, 'MENSAIS'));
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addFluxo(type: FluxoTipo): void {
    this.fluxos.push(buildFluxoGroup(this.fb, type));
  }

  removeFluxo(index: number): void {
    this.fluxos.removeAt(index);
  }

  step1Valid(): boolean {
    return ['name', 'totalValue', 'contractDate', 'inccBaseMonth', 'inccLagMonths'].every((c) => this.form.get(c)?.valid);
  }

  next(): void {
    if (!this.step1Valid()) {
      this.form.markAllAsTouched();
      this.notificationService.showMessage('Preencha nome, valor, data do contrato e mês-base do INCC', 'error');
      return;
    }

    this.step = 2;
  }

  save(): void {
    if (!this.user) return;

    if (this.fluxos.length === 0 || this.fluxos.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showMessage('Revise os fluxos de pagamento (valor e 1º vencimento são obrigatórios)', 'error');
      return;
    }

    const v = this.form.value;
    const input: CreateImovelInput = {
      userId: this.user.id,
      name: v.name,
      developer: v.developer || undefined,
      totalValue: Number(v.totalValue),
      contractDate: v.contractDate,
      inccBaseMonth: v.inccBaseMonth,
      inccLagMonths: Number(v.inccLagMonths),
      deliveryDate: v.deliveryDate || undefined,
      financingStartDate: v.financingStartDate || undefined,
      fluxos: v.fluxos.map((f: any) => ({
        type: f.type,
        description: f.description || undefined,
        installmentsCount: Number(f.installmentsCount),
        installmentAmount: Number(f.installmentAmount),
        firstDueDate: f.firstDueDate,
        periodicityMonths: Number(f.periodicityMonths),
        indexType: f.indexType,
      })),
    };

    this.saving = true;

    this.imovelService.create(input).subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.notificationService.showMessage('Imóvel cadastrado com sucesso', 'success');
        this.load();
      },
      error: (error) => {
        this.saving = false;
        this.notificationService.showMessage(error?.error?.message || 'Erro ao cadastrar imóvel', 'error');
      },
    });
  }

  /** Mostra, na própria tela, qual mês de INCC será usado numa parcela de exemplo. */
  lagExample(): string {
    const lag = Number(this.form.get('inccLagMonths')?.value ?? 2);
    const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const due = 5; // exemplo: parcela de junho
    const ref = ((due - lag) % 12 + 12) % 12;

    return `Parcela de ${names[due]} usa o INCC de ${names[ref]}`;
  }
}
