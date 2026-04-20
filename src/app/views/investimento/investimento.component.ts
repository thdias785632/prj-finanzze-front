import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { UserService } from '../../infra/user/user.service';
import { InvestimentoGateway } from '../../domain/investimento/gateway/investimento.gateway';
import { InvestimentoService } from '../../infra/investimento/investimento.service';
import { PriceGateway } from '../../domain/price/gateway/price.gateway';
import { PriceService } from '../../infra/price/price.service';
import { NotificationService } from '../../infra/notification/notification.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { User } from '../../domain/user/dto/user.dto';
import {
  CategoriaInvestimento,
  Investimento,
  CategoriaComCalculo,
  InvestimentoComCalculo,
  AporteRecomendacao
} from '../../domain/investimento/dto/investimento.dto';

@Component({
  selector: 'app-investimento',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LoaderComponent,
    NotificationComponent,
  ],
  templateUrl: './investimento.component.html',
  styleUrls: ['./investimento.component.scss'],
  providers: [
    { provide: UserGateway, useClass: UserService },
    { provide: InvestimentoGateway, useClass: InvestimentoService },
    { provide: PriceGateway, useClass: PriceService },
    { provide: NotificationService, useClass: NotificationService },
  ]
})
export class InvestimentoComponent implements OnInit {
  user: User | null = null;
  isLoading = false;

  categorias: CategoriaInvestimento[] = [];
  investimentos: Investimento[] = [];
  carteira: CategoriaComCalculo[] = [];
  totalCarteira = 0;
  totalInvestidoCarteira = 0;
  ganhoLossCarteira = 0;

  showCategoriaModal = false;
  showInvestimentoModal = false;
  showAporteModal = false;
  showDeleteCategoriaModal = false;
  showDeleteInvestimentoModal = false;
  showTokenModal = false;

  editInvestimentoMode = false;

  categoriaForm!: FormGroup;
  investimentoForm!: FormGroup;
  aporteForm!: FormGroup;
  tokenForm!: FormGroup;

  categoriaToDelete: CategoriaInvestimento | undefined;
  investimentoToDelete: Investimento | undefined;
  aporteRecomendacoes: AporteRecomendacao[] = [];

  hasBrapiToken = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserGateway,
    private investimentoService: InvestimentoGateway,
    private priceService: PriceGateway,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.user = this.userService.getUser();
    this.buildForms();
    this.hasBrapiToken = !!this.priceService.getBrapiToken();
    this.loadData();
  }

  buildForms(): void {
    this.categoriaForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      targetPercentage: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    });

    this.investimentoForm = this.formBuilder.group({
      id: new FormControl(''),
      categoriaId: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      currentValue: new FormControl(0, [Validators.min(0)]),
      targetPercentage: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]),
      quantity: new FormControl(null),
      averagePrice: new FormControl(null),
      currentPrice: new FormControl(null),
    });

    this.aporteForm = this.formBuilder.group({
      valorAporte: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    });

    this.tokenForm = this.formBuilder.group({
      token: new FormControl(this.priceService.getBrapiToken() ?? ''),
    });

    // Auto-calcula currentValue quando quantity e currentPrice são preenchidos
    this.investimentoForm.get('quantity')?.valueChanges.subscribe(() => this.autoCalcCurrentValue());
    this.investimentoForm.get('currentPrice')?.valueChanges.subscribe(() => this.autoCalcCurrentValue());
  }

  autoCalcCurrentValue(): void {
    const qty = this.investimentoForm.get('quantity')?.value;
    const price = this.investimentoForm.get('currentPrice')?.value;
    if (qty && price && qty > 0 && price > 0) {
      this.investimentoForm.get('currentValue')?.setValue(qty * price, { emitEvent: false });
    }
  }

  loadData(): void {
    if (!this.user) return;

    this.isLoading = true;

    this.investimentoService.getCategoriasByUserId(this.user.id).subscribe({
      next: (categorias) => {
        this.categorias = categorias;

        this.investimentoService.getInvestimentosByUserId(this.user!.id).subscribe({
          next: (investimentos) => {
            this.investimentos = investimentos;
            this.calcularCarteira();
            this.atualizarPrecosAutomatico();
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.showMessage(error.message, 'error');
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(error.message, 'error');
      }
    });
  }

  /**
   * Busca as cotações mais recentes na API pública ao abrir a tela.
   * Atualiza apenas em memória; o usuário pode clicar em "Salvar preços" para persistir.
   */
  private atualizarPrecosAutomatico(): void {
    const tickers = this.investimentos
      .filter((i) => !!i.quantity && i.quantity > 0 && !!i.name)
      .map((i) => i.name);

    if (tickers.length === 0) {
      this.isLoading = false;
      return;
    }

    this.priceService.getPrices(tickers).subscribe({
      next: (precos) => {
        let algum = false;
        for (const inv of this.investimentos) {
          const cot = precos[inv.name?.toUpperCase?.() ?? ''];
          if (cot && inv.quantity && inv.quantity > 0) {
            inv.currentPrice = cot.price;
            inv.currentValue = inv.quantity * cot.price;
            algum = true;
          }
        }
        if (algum) this.calcularCarteira();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  calcularCarteira(): void {
    this.totalCarteira = this.investimentos.reduce((sum, inv) => sum + inv.currentValue, 0);

    // Totais de valorização para o resumo geral
    let totalInvestido = 0;
    let totalAtual = 0;
    let temValorizacao = false;

    this.carteira = this.categorias.map((cat) => {
      const ativos = this.investimentos.filter((inv) => inv.categoriaId === cat.id);
      const totalCategoria = ativos.reduce((sum, inv) => sum + inv.currentValue, 0);
      const percentualNaCarteira = this.totalCarteira > 0 ? (totalCategoria / this.totalCarteira) * 100 : 0;

      const ativosComCalculo: InvestimentoComCalculo[] = ativos.map((inv) => {
        const calc: InvestimentoComCalculo = {
          ...inv,
          percentualNaCategoria: totalCategoria > 0 ? (inv.currentValue / totalCategoria) * 100 : 0,
          percentualNaCarteira: this.totalCarteira > 0 ? (inv.currentValue / this.totalCarteira) * 100 : 0,
        };

        // Valorização: só calcula se tiver quantidade e ambos os preços
        if (inv.quantity && inv.averagePrice && inv.currentPrice) {
          const totalInv = inv.quantity * inv.averagePrice;
          const valorAtual = inv.quantity * inv.currentPrice;
          calc.totalInvestido = totalInv;
          calc.valorAtual = valorAtual;
          calc.ganhoLoss = valorAtual - totalInv;
          calc.valorizacaoPct = ((inv.currentPrice - inv.averagePrice) / inv.averagePrice) * 100;

          totalInvestido += totalInv;
          totalAtual += valorAtual;
          temValorizacao = true;
        }

        return calc;
      });

      return {
        ...cat,
        ativos: ativosComCalculo,
        totalCategoria,
        percentualNaCarteira,
      };
    });

    if (temValorizacao) {
      this.totalInvestidoCarteira = totalInvestido;
      this.ganhoLossCarteira = totalAtual - totalInvestido;
    } else {
      this.totalInvestidoCarteira = 0;
      this.ganhoLossCarteira = 0;
    }
  }

  /**
   * Distribui um aporte entre categorias e ativos considerando o estado atual
   * da carteira vs. metas definidas pelo usuário (rebalanceamento).
   *
   * Estratégia:
   *  1. Calcula o total da carteira APÓS o aporte: totalNovo = totalAtual + aporte.
   *  2. Para cada categoria, calcula o déficit em relação ao alvo:
   *     alvo      = totalNovo * (targetCategoria / 100)
   *     déficit   = max(0, alvo - totalAtualCategoria)
   *  3. Se a soma dos déficits >= aporte, distribui o aporte proporcionalmente
   *     ao déficit (foca apenas em cobrir as categorias abaixo do alvo).
   *  4. Caso contrário, cobre todos os déficits e distribui o excedente
   *     proporcional ao target de cada categoria (mantendo a meta a longo prazo).
   *  5. Aplica a mesma lógica dentro da categoria para distribuir o valor
   *     alocado entre os ativos, considerando o valor atual de cada um.
   */
  calcularAporte(): void {
    if (this.aporteForm.invalid) {
      this.notificationService.showMessage('Informe um valor de aporte válido', 'error');
      return;
    }

    const valorAporte: number = Number(this.aporteForm.value.valorAporte);
    const totalAtual = this.totalCarteira;
    const totalNovo = totalAtual + valorAporte;

    type CatInfo = {
      cat: CategoriaComCalculo;
      deficit: number;
    };

    const catInfos: CatInfo[] = this.carteira.map((cat) => {
      const alvo = totalNovo * (cat.targetPercentage / 100);
      const deficit = Math.max(0, alvo - cat.totalCategoria);
      return { cat, deficit };
    });

    const somaDeficits = catInfos.reduce((s, c) => s + c.deficit, 0);
    const somaTargetsCat = this.carteira.reduce((s, c) => s + (c.targetPercentage || 0), 0);

    const alocacaoCategoria = new Map<string, number>();

    if (valorAporte <= 0) {
      for (const c of catInfos) alocacaoCategoria.set(c.cat.id!, 0);
    } else if (somaDeficits >= valorAporte) {
      // Aporte insuficiente para cobrir déficits: rateia pelos déficits
      for (const c of catInfos) {
        const valor = somaDeficits > 0 ? valorAporte * (c.deficit / somaDeficits) : 0;
        alocacaoCategoria.set(c.cat.id!, valor);
      }
    } else {
      // Cobre déficits e distribui o excedente proporcional ao target
      const excesso = valorAporte - somaDeficits;
      for (const c of catInfos) {
        const extra =
          somaTargetsCat > 0 ? excesso * ((c.cat.targetPercentage || 0) / somaTargetsCat) : 0;
        alocacaoCategoria.set(c.cat.id!, c.deficit + extra);
      }
    }

    this.aporteRecomendacoes = this.carteira.map((cat) => {
      const valorCategoria = alocacaoCategoria.get(cat.id!) ?? 0;
      const totalNovoCategoria = cat.totalCategoria + valorCategoria;

      type AtivoInfo = {
        ativo: InvestimentoComCalculo;
        deficit: number;
      };

      const ativoInfos: AtivoInfo[] = cat.ativos.map((ativo) => {
        const alvoAtivo = totalNovoCategoria * ((ativo.targetPercentage || 0) / 100);
        const deficitAtivo = Math.max(0, alvoAtivo - ativo.currentValue);
        return { ativo, deficit: deficitAtivo };
      });

      const somaDeficitsAtivos = ativoInfos.reduce((s, a) => s + a.deficit, 0);
      const somaTargetsAtivos = cat.ativos.reduce((s, a) => s + (a.targetPercentage || 0), 0);

      const ativos = ativoInfos.map(({ ativo, deficit }) => {
        let valorRecomendado = 0;
        if (valorCategoria <= 0) {
          valorRecomendado = 0;
        } else if (somaDeficitsAtivos >= valorCategoria) {
          valorRecomendado =
            somaDeficitsAtivos > 0 ? valorCategoria * (deficit / somaDeficitsAtivos) : 0;
        } else {
          const excessoAtivo = valorCategoria - somaDeficitsAtivos;
          const extra =
            somaTargetsAtivos > 0
              ? excessoAtivo * ((ativo.targetPercentage || 0) / somaTargetsAtivos)
              : 0;
          valorRecomendado = deficit + extra;
        }

        return {
          ativoId: ativo.id!,
          ativoNome: ativo.name,
          valorRecomendado,
          currentPrice: ativo.currentPrice,
          quantidadeRecomendada:
            ativo.currentPrice && ativo.currentPrice > 0
              ? valorRecomendado / ativo.currentPrice
              : undefined,
        };
      });

      return {
        categoriaId: cat.id!,
        categoriaNome: cat.name,
        valorRecomendado: valorCategoria,
        ativos,
      };
    });
  }

  atualizarPrecosManual(): void {
    const ativosComTicker = this.investimentos.filter((i) => !!i.quantity && i.quantity > 0 && !!i.name);
    if (ativosComTicker.length === 0) {
      this.notificationService.showMessage(
        'Cadastre quantidade e um ticker válido nos ativos para buscar cotações automaticamente.',
        'error',
      );
      return;
    }

    this.isLoading = true;
    this.priceService.getPrices(ativosComTicker.map((i) => i.name)).subscribe({
      next: (precos) => {
        const atualizados: Investimento[] = [];
        const falharam: string[] = [];
        for (const inv of this.investimentos) {
          const cot = precos[inv.name?.toUpperCase?.() ?? ''];
          if (cot && inv.quantity && inv.quantity > 0) {
            inv.currentPrice = cot.price;
            inv.currentValue = inv.quantity * cot.price;
            atualizados.push(inv);
          } else if (inv.quantity && inv.quantity > 0) {
            falharam.push(inv.name);
          }
        }

        this.calcularCarteira();

        if (atualizados.length === 0) {
          this.isLoading = false;
          const msg = !this.hasBrapiToken
            ? 'Nenhum preço foi atualizado. Configure seu token da brapi para tickers brasileiros.'
            : 'Nenhum preço foi atualizado. Verifique se os nomes dos ativos são tickers válidos.';
          this.notificationService.showMessage(msg, 'error');
          return;
        }

        // Persiste no backend em paralelo
        const reqs = atualizados.map((inv) =>
          this.investimentoService.updateInvestimento(inv).pipe(catchError(() => of(null))),
        );
        forkJoin(reqs).subscribe({
          next: () => {
            this.isLoading = false;
            const sufixo = falharam.length > 0 ? ` (falhou: ${falharam.join(', ')})` : '';
            this.notificationService.showMessage(
              `${atualizados.length} preço(s) atualizado(s) com sucesso${sufixo}`,
              'success',
            );
          },
          error: () => {
            this.isLoading = false;
            this.notificationService.showMessage(
              'Preços atualizados em tela, mas houve erro ao salvar.',
              'error',
            );
          },
        });
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showMessage('Erro ao buscar cotações.', 'error');
      },
    });
  }

  salvarToken(): void {
    const token = (this.tokenForm.value.token ?? '').toString().trim();
    this.priceService.setBrapiToken(token || null);
    this.hasBrapiToken = !!token;
    this.showTokenModal = false;
    this.notificationService.showMessage(
      token ? 'Token da brapi salvo com sucesso' : 'Token da brapi removido',
      'success',
    );
  }

  onAddCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
      return;
    }

    this.isLoading = true;

    const categoria: CategoriaInvestimento = {
      userId: this.user!.id,
      name: this.categoriaForm.value.name,
      targetPercentage: this.categoriaForm.value.targetPercentage,
    };

    this.investimentoService.createCategoria(categoria).subscribe({
      next: () => {
        this.loadData();
        this.showCategoriaModal = false;
        this.categoriaForm.reset();
        this.notificationService.showMessage('Categoria criada com sucesso', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(error.message, 'error');
      }
    });
  }

  onAddInvestimento(): void {
    if (this.investimentoForm.invalid) {
      this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
      return;
    }

    this.isLoading = true;
    const formData = this.investimentoForm.value;

    const payload: Investimento = {
      userId: this.user!.id,
      categoriaId: formData.categoriaId,
      name: formData.name,
      currentValue: formData.currentValue || 0,
      targetPercentage: formData.targetPercentage,
      quantity: formData.quantity || undefined,
      averagePrice: formData.averagePrice || undefined,
      currentPrice: formData.currentPrice || undefined,
    };

    if (this.editInvestimentoMode) {
      const updated = { ...payload, id: formData.id };

      this.investimentoService.updateInvestimento(updated).subscribe({
        next: () => {
          this.loadData();
          this.closeInvestimentoModal();
          this.notificationService.showMessage('Ativo atualizado com sucesso', 'success');
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showMessage(error.message, 'error');
        }
      });
    } else {
      this.investimentoService.createInvestimento(payload).subscribe({
        next: () => {
          this.loadData();
          this.closeInvestimentoModal();
          this.notificationService.showMessage('Ativo cadastrado com sucesso', 'success');
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showMessage(error.message, 'error');
        }
      });
    }
  }

  openEditInvestimento(investimento: InvestimentoComCalculo): void {
    this.editInvestimentoMode = true;
    this.showInvestimentoModal = true;

    this.investimentoForm.patchValue({
      id: investimento.id,
      categoriaId: investimento.categoriaId,
      name: investimento.name,
      currentValue: investimento.currentValue,
      targetPercentage: investimento.targetPercentage,
      quantity: investimento.quantity ?? null,
      averagePrice: investimento.averagePrice ?? null,
      currentPrice: investimento.currentPrice ?? null,
    });
  }

  closeInvestimentoModal(): void {
    this.showInvestimentoModal = false;
    this.editInvestimentoMode = false;
    this.investimentoForm.reset();
    this.investimentoForm.patchValue({ currentValue: 0, targetPercentage: 0 });
  }

  toggleDeleteCategoriaModal(categoria?: CategoriaInvestimento): void {
    this.categoriaToDelete = categoria;
    this.showDeleteCategoriaModal = !this.showDeleteCategoriaModal;
  }

  toggleDeleteInvestimentoModal(investimento?: Investimento): void {
    this.investimentoToDelete = investimento;
    this.showDeleteInvestimentoModal = !this.showDeleteInvestimentoModal;
  }

  onRemoveCategoria(): void {
    if (!this.categoriaToDelete?.id) return;

    this.isLoading = true;

    this.investimentoService.deleteCategoria(this.categoriaToDelete.id).subscribe({
      next: () => {
        this.loadData();
        this.showDeleteCategoriaModal = false;
        this.notificationService.showMessage('Categoria removida com sucesso', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(error.message, 'error');
      }
    });
  }

  onRemoveInvestimento(): void {
    if (!this.investimentoToDelete?.id) return;

    this.isLoading = true;

    this.investimentoService.deleteInvestimento(this.investimentoToDelete.id).subscribe({
      next: () => {
        this.loadData();
        this.showDeleteInvestimentoModal = false;
        this.notificationService.showMessage('Ativo removido com sucesso', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(error.message, 'error');
      }
    });
  }

  getNomeCategoriaById(id: string): string {
    return this.categorias.find(c => c.id === id)?.name ?? '';
  }
}
