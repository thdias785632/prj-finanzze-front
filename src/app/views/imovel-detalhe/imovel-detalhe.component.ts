import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FluxoFieldsComponent, buildFluxoGroup } from '../../components/fluxo-fields/fluxo-fields.component';
import { LoaderComponent } from '../../components/loader/loader.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { ModalDirective } from '../../directives/modal.directive';
import { Fluxo, FluxoInput, ImovelDetalhe, Parcela } from '../../domain/imovel/dto/imovel.dto';
import { ImovelGateway } from '../../domain/imovel/gateway/imovel.gateway';
import { User } from '../../domain/user/dto/user.dto';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { ImovelService } from '../../infra/imovel/imovel.service';
import { NotificationService } from '../../infra/notification/notification.service';
import { UserService } from '../../infra/user/user.service';

@Component({
  selector: 'app-imovel-detalhe',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatButtonModule, ModalDirective, LoaderComponent, NotificationComponent, FluxoFieldsComponent,
  ],
  templateUrl: './imovel-detalhe.component.html',
  styleUrls: ['./imovel-detalhe.component.scss'],
  providers: [
    { provide: UserGateway, useClass: UserService },
    { provide: ImovelGateway, useClass: ImovelService },
    { provide: NotificationService, useClass: NotificationService },
  ]
})
export class ImovelDetalheComponent implements OnInit {
  user: User | null = null;
  isLoading = false;
  detalhe?: ImovelDetalhe;
  imovelId = '';

  lagOptions = [0, 1, 2, 3, 4, 5, 6];
  expanded: { [id: string]: { open: boolean; all: boolean } | undefined } = {};

  inccForm!: FormGroup;
  editForm!: FormGroup;
  payForm!: FormGroup;
  fluxoForm!: FormGroup;

  showPayModal = false;
  showFluxoModal = false;
  showEditModal = false;
  showDeleteModal = false;
  parcelaToPay?: Parcela;
  fluxoToDelete?: Fluxo;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserGateway,
    private imovelService: ImovelGateway,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.user = this.userService.getUser();
    this.imovelId = this.route.snapshot.paramMap.get('id') || '';

    this.inccForm = this.fb.group({
      inccLagMonths: new FormControl(2, [Validators.required]),
      inccBaseMonth: new FormControl('', [Validators.required]),
    });

    this.payForm = this.fb.group({
      paidAt: new FormControl('', [Validators.required]),
      paidAmount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
    });

    this.load();
  }

  get imovel() { return this.detalhe?.imovel; }

  load(): void {
    if (!this.user) return;

    this.isLoading = true;

    this.imovelService.getById(this.imovelId, this.user.id).subscribe({
      next: (detalhe) => {
        this.detalhe = detalhe;
        this.isLoading = false;
        this.inccForm.patchValue({
          inccLagMonths: detalhe.imovel.inccLagMonths,
          inccBaseMonth: detalhe.imovel.inccBaseMonth.slice(0, 7),
        });
        this.inccForm.markAsPristine();

        // primeiro carregamento: abre o primeiro fluxo que ainda tem parcela em aberto
        if (Object.keys(this.expanded).length === 0) {
          const first = detalhe.fluxos.find((f) => f.paidCount < f.parcelas.length) || detalhe.fluxos[0];

          if (first) this.expanded[first.id] = { open: true, all: false };
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(error?.error?.message || 'Erro ao carregar o imóvel', 'error');

        if (error?.status === 404) this.router.navigate(['/imoveis']);
      },
    });
  }

  // ---------- INCC ----------
  lagPreview(): string {
    const lag = Number(this.inccForm.get('inccLagMonths')?.value ?? 2);
    const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const next = this.imovel?.nextInstallment;
    const due = next ? new Date(next.dueDate + 'T00:00:00') : new Date();
    const ref = new Date(due.getFullYear(), due.getMonth() - lag, 1);

    return `Parcela de ${names[due.getMonth()]}/${due.getFullYear()} usa o INCC de ${names[ref.getMonth()]}/${ref.getFullYear()}`;
  }

  saveIncc(): void {
    if (!this.user || this.inccForm.invalid) return;

    const v = this.inccForm.value;

    this.imovelService.update({
      id: this.imovelId,
      userId: this.user.id,
      inccLagMonths: Number(v.inccLagMonths),
      inccBaseMonth: v.inccBaseMonth,
    }).subscribe({
      next: () => { this.notificationService.showMessage('Correção atualizada', 'success'); this.load(); },
      error: (error) => this.notificationService.showMessage(error?.error?.message || 'Erro ao salvar', 'error'),
    });
  }

  // ---------- parcelas ----------
  toggle(fluxo: Fluxo): void {
    const current = this.expanded[fluxo.id] || { open: false, all: false };

    this.expanded[fluxo.id] = { ...current, open: !current.open };
  }

  toggleAll(fluxo: Fluxo): void {
    const current = this.expanded[fluxo.id] || { open: true, all: false };

    this.expanded[fluxo.id] = { ...current, all: !current.all };
  }

  visibleParcelas(fluxo: Fluxo): Parcela[] {
    if (this.expanded[fluxo.id]?.all) return fluxo.parcelas;

    const open = fluxo.parcelas.filter((p) => !p.paid).slice(0, 6);

    return open.length > 0 ? open : fluxo.parcelas.slice(-3);
  }

  openPay(parcela: Parcela): void {
    this.parcelaToPay = parcela;
    this.payForm.patchValue({ paidAt: new Date().toLocaleDateString('en-CA'), paidAmount: parcela.correctedAmount });
    this.showPayModal = true;
  }

  confirmPay(): void {
    if (!this.user || !this.parcelaToPay || this.payForm.invalid) return;

    const v = this.payForm.value;

    this.saving = true;

    this.imovelService.payParcela(this.parcelaToPay.id, this.user.id, v.paidAt, Number(v.paidAmount)).subscribe({
      next: () => {
        this.saving = false;
        this.showPayModal = false;
        this.notificationService.showMessage('Parcela marcada como paga', 'success');
        this.load();
      },
      error: (error) => { this.saving = false; this.notificationService.showMessage(error?.error?.message || 'Erro ao registrar pagamento', 'error'); },
    });
  }

  undo(parcela: Parcela): void {
    if (!this.user) return;

    this.imovelService.unpayParcela(parcela.id, this.user.id).subscribe({
      next: () => { this.notificationService.showMessage('Pagamento desfeito', 'success'); this.load(); },
      error: (error) => this.notificationService.showMessage(error?.error?.message || 'Erro ao desfazer', 'error'),
    });
  }

  // ---------- fluxos ----------
  openFluxoModal(): void {
    this.fluxoForm = buildFluxoGroup(this.fb, 'MENSAIS');
    this.showFluxoModal = true;
  }

  saveFluxo(): void {
    if (!this.user || this.fluxoForm.invalid) {
      this.fluxoForm.markAllAsTouched();
      return;
    }

    const f = this.fluxoForm.value;
    const input: FluxoInput = {
      type: f.type,
      description: f.description || undefined,
      installmentsCount: Number(f.installmentsCount),
      installmentAmount: Number(f.installmentAmount),
      firstDueDate: f.firstDueDate,
      periodicityMonths: Number(f.periodicityMonths),
      indexType: f.indexType,
    };

    this.saving = true;

    this.imovelService.addFluxo(this.imovelId, this.user.id, input).subscribe({
      next: () => { this.saving = false; this.showFluxoModal = false; this.notificationService.showMessage('Fluxo adicionado', 'success'); this.load(); },
      error: (error) => { this.saving = false; this.notificationService.showMessage(error?.error?.message || 'Erro ao adicionar fluxo', 'error'); },
    });
  }

  confirmDeleteFluxo(): void {
    if (!this.user || !this.fluxoToDelete) return;

    this.imovelService.deleteFluxo(this.fluxoToDelete.id, this.user.id).subscribe({
      next: () => { this.fluxoToDelete = undefined; this.notificationService.showMessage('Fluxo removido', 'success'); this.load(); },
      error: (error) => { this.fluxoToDelete = undefined; this.notificationService.showMessage(error?.error?.message || 'Erro ao remover fluxo', 'error'); },
    });
  }

  // ---------- imóvel ----------
  openEdit(): void {
    const i = this.imovel;

    if (!i) return;

    this.editForm = this.fb.group({
      name: new FormControl(i.name, [Validators.required]),
      developer: new FormControl(i.developer || ''),
      address: new FormControl(i.address || ''),
      totalValue: new FormControl(i.totalValue, [Validators.required, Validators.min(0)]),
      deliveryDate: new FormControl(i.deliveryDate || ''),
      financingStartDate: new FormControl(i.financingStartDate || ''),
      notes: new FormControl(i.notes || ''),
    });
    this.showEditModal = true;
  }

  saveEdit(): void {
    if (!this.user || this.editForm.invalid) return;

    const v = this.editForm.value;

    this.imovelService.update({
      id: this.imovelId,
      userId: this.user.id,
      name: v.name,
      developer: v.developer,
      address: v.address,
      totalValue: Number(v.totalValue),
      deliveryDate: v.deliveryDate || null,
      financingStartDate: v.financingStartDate || null,
      notes: v.notes,
    }).subscribe({
      next: () => { this.showEditModal = false; this.notificationService.showMessage('Imóvel atualizado', 'success'); this.load(); },
      error: (error) => this.notificationService.showMessage(error?.error?.message || 'Erro ao salvar', 'error'),
    });
  }

  confirmDeleteImovel(): void {
    if (!this.user) return;

    this.imovelService.delete(this.imovelId, this.user.id).subscribe({
      next: () => { this.notificationService.showMessage('Imóvel removido', 'success'); this.router.navigate(['/imoveis']); },
      error: (error) => { this.showDeleteModal = false; this.notificationService.showMessage(error?.error?.message || 'Erro ao remover', 'error'); },
    });
  }
}
