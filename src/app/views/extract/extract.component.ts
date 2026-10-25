import { ModalDirective } from '../../directives/modal.directive';
import { Component, Input, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { UserService } from '../../infra/user/user.service';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { Expensses, Itens, Revenue, User, UserExtract } from '../../domain/user/dto/user.dto';
import { LoaderComponent } from '../../components/loader/loader.component';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatDateToAmericanFormat, formatDateToBrazilianFormat } from '../../utils/date';
import { NotificationService } from '../../infra/notification/notification.service';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CardGateway } from '../../domain/card/gateway/card.gateway';
import { CardService } from '../../infra/card/card.service';
import { Card, CardExpensses } from '../../domain/card/dto/card.dto';
import { RouterModule } from '@angular/router';
import { CategoriesGateway } from '../../domain/categories/gateway/categories.gateway';
import { CategoriesService } from '../../infra/categories/categories.service';
import { Categories } from '../../domain/categories/dto/categories.dto';
import { DashboardChartComponent } from '../../components/dashboard-chart/dashboard-chart.component';

@Component({
  selector: 'app-extract',
  imports: [
    ModalDirective,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    LoaderComponent,
    MatButtonModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    NotificationComponent,
    MatSelectModule,
    RouterModule,
    DashboardChartComponent
  ],
  templateUrl: './extract.component.html',
  styleUrls: ['./extract.component.scss'],
  providers: [
    { provide: UserGateway, useClass: UserService },
    { provide: NotificationService, useClass: NotificationService },
    { provide: CardGateway, useClass: CardService },
    { provide: CategoriesGateway, useClass: CategoriesService },
  ]
})
export class ExtractComponent implements OnInit {
  @Input() referenceDate: Date = new Date()

  user: User | null = null;
  userExtract!: UserExtract;
  cards: Card[] = [];
  categories: Categories[] = [];

  isLoading: boolean = false;
  
  showRevenueModal: boolean = false;
  showExpenssesModal: boolean = false;

  showExpensses: boolean = false;

  showDeleteRevenueModal: boolean = false;
  showDeleteExpenssesModal: boolean = false;
  showDeleteCardExpenssesModal: boolean = false;
  
  showCategoryModal: boolean = false;
  showCardExtractModal: boolean = false;
  
  revenueForm!: FormGroup;
  expenssesForm!: FormGroup;
  expenssesEditForm!: FormGroup;
  cardExpenssesEditForm!: FormGroup;
  cardExpenssesForm!: FormGroup;
  categoryForm!: FormGroup;
  
  revenueToDelete: Itens | undefined = undefined;
  expenssesToDelete: Itens | undefined = undefined;
  
  categoriesGrouped!: {[key: string]: number};
  
  cardExpenssesToDelete: Itens | undefined;
  
  editExpenssesMode: boolean = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private userService: UserGateway,
    private cardService: CardGateway,
    private categoriesService: CategoriesGateway,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.user = this.userService.getUser();

    this.buildForm();

    this.getUserExtract();
  }

  buildForm(): void {
    this.revenueForm = this.formBuilder.group({
      referenceDate: new FormControl(formatDateToAmericanFormat(this.referenceDate), [Validators.required]),
      name: new FormControl('', [Validators.required]),
      value: new FormControl(0, [Validators.required]),
      active: new FormControl(true),
      recurrent: new FormControl(false),
    });

    this.expenssesForm = this.formBuilder.group({
      referenceDate: new FormControl(formatDateToAmericanFormat(this.referenceDate), [Validators.required]),
      name: new FormControl('', [Validators.required]),
      value: new FormControl(0, [Validators.required]),
      active: new FormControl(true),
      recurrent: new FormControl(false),
      category: new FormControl('', [Validators.required]),
    });

    this.cardExpenssesForm = this.formBuilder.group({
      cardId: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      value: new FormControl(0, [Validators.required]),
      installments: new FormControl(0, [Validators.min(0)]),
      referenceDate: new FormControl(formatDateToAmericanFormat(this.referenceDate), [Validators.required]),
      active: new FormControl(true),
      recurrent: new FormControl(false),
      category: new FormControl('', [Validators.required]),
    });

    this.categoryForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
    });
  }

  getUserExtract(): void {
    if (this.user) {
      this.isLoading = true;

      const formattedDate = formatDateToAmericanFormat(this.referenceDate);

      this.userService.getUserExtract(this.user.id, formattedDate).subscribe(
        (expenses) => {
          this.userExtract = expenses;

          this.getCategories();
        },
        (error: any) => {
          this.notificationService.showMessage(`${error.message}`, 'error');
        },
        () => { 
          this.isLoading = false; 
        }
      );
    }
  }

  getCategories(): void {
    if (this.user) {
      this.isLoading = true;

      this.categoriesService.getCategoriesByUserId(this.user.id).subscribe(
        (data) => {
          this.categories = data;

          this.groupCategories();
        },
        (error: any) => {

          this.notificationService.showMessage(`${error.message}`, 'error');
        },
        () => { 
          this.isLoading = false; 
        }
      );
    }
  }

  groupCategories(): void {
        const categoryMap: {[key: string]: number} = {};

        this.userExtract.cardExpensess.forEach(expensse => {
            if (!expensse.category) {
                return;
            }
            
            if (expensse.category in categoryMap) {
                categoryMap[expensse.category] += expensse.value;
            } else {
                categoryMap[expensse.category] = expensse.value;
            }
        });

        this.userExtract.fixedExpensess.forEach(expensse => {
            if (!expensse.category) {
                return;
            }
            
            if (expensse.category in categoryMap) {
                categoryMap[expensse.category] += expensse.value;
            } else {
                categoryMap[expensse.category] = expensse.value;
            }
        });

        categoryMap['Economia'] = 
          this.userExtract.totalRevenues - this.userExtract.totalExpensess > 0 ?
          this.userExtract.totalRevenues - this.userExtract.totalExpensess : 0;

        this.categoriesGrouped = Object.fromEntries(
            Object.entries(categoryMap).sort(([, a], [, b]) => b - a)
        );
  }

  hasInactiveItems(ItensToSearch: 'expensses' | 'revenues' | 'carsExpensses'): boolean {
    if (ItensToSearch === 'expensses') {
      return this.userExtract?.fixedExpensess.some(expensse => !expensse.active) || false;
    }
    if (ItensToSearch === 'revenues') {
      return this.userExtract?.revenues.some(revenue => !revenue.active) || false;
    }
    if (ItensToSearch === 'carsExpensses') {
      return this.userExtract?.cardExpensess.some(cardExpensse => !cardExpensse.active) || false;
    }
    return false;
  }

  hasReferenceDatePresente(): boolean {
    return formatDateToAmericanFormat(new Date()) === formatDateToAmericanFormat(this.referenceDate);
  }

  onCategorySelection(event: MatSelectChange): void {
    if (event.value === 'add') {
      this.showCategoryModal = true;
    }
  }

  toggleOpenRevenueModal(): void {
    this.showRevenueModal = !this.showRevenueModal;

    this.revenueForm.reset();
    
    if (this.showRevenueModal) {
      this.revenueForm.patchValue({
        referenceDate: formatDateToBrazilianFormat(new Date()),
        active: true,
        recurrent: false,
      });
    }
  }

  toggleOpenExpenssesModal(): void {
    this.showExpenssesModal = !this.showExpenssesModal;

    this.expenssesForm.reset();
    this.cardExpenssesForm.reset();

    if (this.showExpenssesModal) {
      this.expenssesForm.patchValue({
        referenceDate: formatDateToAmericanFormat(this.referenceDate),
        active: true,
        recurrent: false,
      });

      this.cardExpenssesForm.patchValue({
        referenceDate: formatDateToAmericanFormat(this.referenceDate),
        active: true,
        recurrent: false,
      });

      this.isLoading = true;

      this.getCategories();

      this.cardService.getCardsByUserId(this.user!.id).subscribe(
        (cards) => {
          this.cards = cards;

          this.isLoading = false;
        },
        (error: any) => {
          this.showDeleteExpenssesModal = false;

          this.isLoading = false;

          this.notificationService.showMessage(`${error.message}`, 'error');
        }
      );
    }
  }

  toggleRevenueDeleteModal(revenueItem?: Itens): void {
    if (!this.revenueToDelete) {
      this.revenueToDelete = revenueItem;
    } else {
      this.revenueToDelete = undefined;
    }

    this.showDeleteRevenueModal = !this.showDeleteRevenueModal;
  }

  toggleExpenssesDeleteModal(expenssesItem?: Itens): void {
    if (!this.expenssesToDelete) {
      this.expenssesToDelete = expenssesItem;
    } else {
      this.expenssesToDelete = undefined;
    }

    this.showDeleteExpenssesModal = !this.showDeleteExpenssesModal;
  }

  openExpenssesEditModal(expenssesItem: Itens): void {
    this.toggleOpenExpenssesModal()
    
    this.expenssesEditForm = this.formBuilder.group({
      id: new FormControl(expenssesItem.id),
      referenceDate: new FormControl(formatDateToAmericanFormat(new Date(expenssesItem.referenceDate)), [Validators.required]),
      name: new FormControl(expenssesItem.name, [Validators.required]),
      value: new FormControl(expenssesItem.value, [Validators.required]),
      active: new FormControl(expenssesItem.active),
      recurrent: new FormControl(expenssesItem.recurrent),
      category: new FormControl(expenssesItem.category, [Validators.required]),
    });

    this.editExpenssesMode = true;
    this.showExpensses = true;
    this.showExpenssesModal = true;
  }

  openCardExpenssesEditModal(cardExpenssesItem: Itens): void {
    this.toggleOpenExpenssesModal();

    this.cardExpenssesEditForm = this.formBuilder.group({
      id: new FormControl(cardExpenssesItem.id),
      cardId: new FormControl(cardExpenssesItem.cardId, [Validators.required]),
      name: new FormControl(cardExpenssesItem.name, [Validators.required]),
      value: new FormControl(cardExpenssesItem.value, [Validators.required]),
      installments: new FormControl(cardExpenssesItem.installment || 0, [Validators.min(0)]),
      referenceDate: new FormControl(formatDateToAmericanFormat(new Date(cardExpenssesItem.referenceDate)), [Validators.required]),
      active: new FormControl(cardExpenssesItem.active),
      recurrent: new FormControl(cardExpenssesItem.recurrent),
      category: new FormControl(cardExpenssesItem.category, [Validators.required]),
    });

    this.editExpenssesMode = true;
    this.showExpenssesModal = true;
    this.showCardExtractModal = false;
  }

  onAddRevenue(): void {
    if (this.revenueForm.valid) {
      this.isLoading = true;
    
      const formData = this.revenueForm.value;

      const revenue: Revenue = {
        userId: this.user!.id,
        referenceDate: new Date(formData.referenceDate),
        name: formData.name,
        value: formData.value,
        active: !!formData.active,
        recurrent: !!formData.recurrent,
      };

      this.userService.createRevenue(revenue).subscribe(
          () => {
          this.getUserExtract();

          this.toggleOpenRevenueModal();

          this.revenueForm.reset();
          this.revenueForm.patchValue({
            referenceDate: formatDateToAmericanFormat(this.referenceDate),
            active: true,
            recurrent: false,
            value: 0
          });
          
          this.notificationService.showMessage('Receita cadastrada com sucesso', 'success');
          },
          (error) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(`${error.message}`, 'error');
        }
      );

      return;
    }

    this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
  }

  onAddExpensses(): void {
    if (this.expenssesForm.valid) {
      this.isLoading = true;
    
      const formData = this.expenssesForm.value;

      const expensses: Expensses = {
        userId: this.user!.id,
        referenceDate: new Date(formData.referenceDate),
        name: formData.name,
        value: formData.value,
        category: formData.category,
        active: !!formData.active,
        recurrent: !!formData.recurrent,
      };

      this.userService.createExpensses(expensses).subscribe(
          () => {
          this.getUserExtract();

          this.toggleOpenExpenssesModal();

          this.expenssesForm.reset();
          this.expenssesForm.patchValue({
            referenceDate: formatDateToAmericanFormat(this.referenceDate),
            active: true,
            recurrent: false,
            value: 0
          });
          
          this.notificationService.showMessage('Despesa cadastrada com sucesso', 'success');
          },
          (error) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(`${error.message}`, 'error');
        }
      );

      return;
    }

    this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
  }

  onEditExpensses(): void {
    if (this.expenssesEditForm.valid) {
      this.isLoading = true;
    
      const formData = this.expenssesEditForm.value;

      const expensses: Expensses = {
        id: formData.id,
        userId: this.user!.id,
        referenceDate: new Date(formData.referenceDate),
        name: formData.name,
        value: formData.value,
        category: formData.category,
        active: !!formData.active,
        recurrent: !!formData.recurrent,
      };

      this.userService.updateExpensses(expensses).subscribe(
          () => {
          this.getUserExtract();

          this.editExpenssesMode = false;
          this.showExpensses = false;
          this.showExpenssesModal = false;

          this.expenssesEditForm.reset();

          this.expenssesEditForm.patchValue({
            referenceDate: formatDateToAmericanFormat(this.referenceDate),
            active: true,
            recurrent: false,
            value: 0
          });
          
          this.notificationService.showMessage('Despesa atualizada com sucesso', 'success');
          },
          (error: any) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(`${error.message}`, 'error');
        }
      );

      return;
    }

    this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
  }

  onAddCardExpensses(): void {
    if (this.cardExpenssesForm.valid) {
      this.isLoading = true;
    
      const formData = this.cardExpenssesForm.value;

      const cardExpensess: CardExpensses = {
        userId: this.user!.id,
        cardId: formData.cardId,
        referenceDate: new Date(formData.referenceDate),
        name: formData.name,
        value: formData.value,
        installments: formData.installments || 0,
        category: formData.category,
        active: !!formData.active,
        recurrent: !!formData.recurrent,
      };

      this.cardService.createCardEspensses(cardExpensess).subscribe(
          () => {
          this.getUserExtract();

          this.toggleOpenExpenssesModal();

          this.cardExpenssesForm.reset();
          this.cardExpenssesForm.patchValue({
            referenceDate: formatDateToAmericanFormat(this.referenceDate),
            active: true,
            recurrent: false,
            value: 0,
            installments: 0
          });
          
          this.notificationService.showMessage('Despesa cadastrada com sucesso', 'success');
          },
          (error) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(`${error.message}`, 'error');
        }
      );

      return;
    }

    this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
  }

  onEditCardExpensses(): void {
    if (this.cardExpenssesEditForm.valid) {
      this.isLoading = true;
    
      const formData = this.cardExpenssesEditForm.value;

      const cardExpensses: CardExpensses = {
        id: formData.id,
        userId: this.user!.id,
        referenceDate: new Date(formData.referenceDate),
        name: formData.name,
        value: formData.value,
        category: formData.category,
        active: !!formData.active,
        recurrent: !!formData.recurrent,
        cardId: formData.cardId,
        installments: formData.installments || 0,
      };

      this.cardService.updateCardEspensses(cardExpensses).subscribe(
          () => {
          this.getUserExtract();

          this.editExpenssesMode = false;
          this.showExpensses = false;
          this.showExpenssesModal = false;

          this.cardExpenssesEditForm.reset();

          this.cardExpenssesEditForm.patchValue({
            referenceDate: formatDateToAmericanFormat(this.referenceDate),
            active: true,
            recurrent: false,
            value: 0
          });
          
          this.notificationService.showMessage('Despesa atualizada com sucesso', 'success');
          },
          (error: any) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(`${error.message}`, 'error');
        }
      );

      return;
    }

    this.notificationService.showMessage('Preencha todos os campos corretamente', 'error');
  }

  onRemoveRevenue(): void {
    this.isLoading = true;

    this.userService.deleteRevenue(this.revenueToDelete!.id).subscribe(
      () => {
        this.toggleRevenueDeleteModal();

        this.isLoading = false;

        this.getUserExtract();
        
        this.notificationService.showMessage('Receita removida com sucesso', 'success');
      },
      (error) => {
        this.isLoading = false;
        
        this.notificationService.showMessage(`${error.message}`, 'error');
      }
    );
  }

  onRemoveExpensses(): void {
    this.isLoading = true;

    this.userService.deleteExpensses(this.expenssesToDelete!.id).subscribe(
      () => {
        this.toggleExpenssesDeleteModal();

        this.isLoading = false;

        this.getUserExtract();
        
        this.notificationService.showMessage('Despesa removida com sucesso', 'success');
      },
      (error) => {
        this.isLoading = false;
        
        this.notificationService.showMessage(`${error.message}`, 'error');
      }
    );
  }

  onAddCategory(): void {
    this.isLoading = true;

    const category = {
      userId: this.user!.id,
      name: this.categoryForm.value.name,
    }

    this.categoriesService.createCategory(category).subscribe(
      () => {
        this.getCategories();

        this.showCategoryModal = false;

        this.expenssesForm.patchValue({
          category: this.categoryForm.value.name,
        });

        this.cardExpenssesForm.patchValue({
          category: this.categoryForm.value.name,
        });
        
        this.isLoading = false;
        
        this.notificationService.showMessage('Categoria cadastrada com sucesso', 'success');
      },
      (error) => {
        this.isLoading = false;
        
        this.notificationService.showMessage(`${error.message}`, 'error');
      }
    );
  }

  changeMonth(offset: number): void {
    const newDate = new Date(this.referenceDate);

    newDate.setMonth(newDate.getMonth() + offset);
    
    this.referenceDate = newDate;
    
    this.getUserExtract();
  }

  toggleCardExpenssesDeleteModal(cardExpensses?: Itens): void {
    if (!this.cardExpenssesToDelete) {
      this.cardExpenssesToDelete = cardExpensses;
    } else {
      this.cardExpenssesToDelete = undefined;
    }

    this.showDeleteCardExpenssesModal = !this.showDeleteCardExpenssesModal;
  }

  onRemoveCardExpensses(): void {
    if (this.cardExpenssesToDelete) {
      this.isLoading = true;

      this.cardService.deleteCardExpensses(this.cardExpenssesToDelete.id!).subscribe({
        next: () => {
          this.getUserExtract();
          
          this.toggleCardExpenssesDeleteModal();
          
          this.isLoading = false;
          
          this.notificationService.showMessage('Despesa do cartão removida com sucesso!', 'success');
        },
        error: (error) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(error.message, 'error');
        }
      });
    }
  }

  sendExtract(): void {
    this.isLoading = true;

    this.userService.sendExtract(this.user!.email).subscribe({
      next: () => {
        this.isLoading = false;
        
        this.notificationService.showMessage('Extrato enviado com sucesso!', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        
        this.notificationService.showMessage(error.message, 'error');
      }
    });
  }
}
