import { Component, Input, OnInit } from '@angular/core';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { NotificationService } from '../../infra/notification/notification.service';
import { CardGateway } from '../../domain/card/gateway/card.gateway';
import { CardService } from '../../infra/card/card.service';
import { UserService } from '../../infra/user/user.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { LoaderComponent } from '../../components/loader/loader.component';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationComponent } from '../../components/notification/notification.component';
import { MatSelectModule } from '@angular/material/select';
import { User } from '../../domain/user/dto/user.dto';
import { Card, CardExpensses, CardsExtract } from '../../domain/card/dto/card.dto';
import { formatDateToAmericanFormat } from '../../utils/date';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-card',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    LoaderComponent,
    MatButtonModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    NotificationComponent,
    MatSelectModule,
    RouterModule,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  providers: [
    { provide: UserGateway, useClass: UserService },
    { provide: NotificationService, useClass: NotificationService },
    { provide: CardGateway, useClass: CardService }
  ]
})
export class CardComponent implements OnInit {
  @Input() referenceDate: Date = new Date();

  user: User | null = null;

  isLoading: boolean = false;

  cardsExtract: CardsExtract[] = [];
  cardsList: any = [];

  cardExpenssesForm!: FormGroup;
  cardForm!: FormGroup;

  showCreateCardModal: boolean = false;
  showDeleteCardExpenssesModal: boolean = false;

  cardExpenssesToDelete: CardExpensses | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserGateway,
    private cardService: CardGateway,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user = this.userService.getUser();

    this.buildForm();

    if (this.router.routerState.snapshot.root.queryParams['openModal']) {
      this.showCreateCardModal = true;
    }

    this.getCards();
  }

  buildForm(): void {
    this.cardForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      active: new FormControl(true, [Validators.required]),
      flag: new FormControl('', [Validators.required]),
    });

    this.cardExpenssesForm = this.formBuilder.group({
      cardId: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      value: new FormControl(0, [Validators.required]),
      installments: new FormControl(0, [Validators.required]),
      referenceDate: new FormControl('', [Validators.required]),
      active: new FormControl(true, [Validators.required]),
      recurrent: new FormControl(false, [Validators.required]),
    });
  }

  getCards(): void {
    this.isLoading = true;

    const formattedDate = formatDateToAmericanFormat(this.referenceDate);
    
    this.cardService.getCardsExtract(this.user!.id, formattedDate).subscribe({
      next: (cards) => {
        for (let cardExtract of cards) {
          cardExtract.cardExpensess.sort((a, b) => a.installments - b.installments);

          this.cardsExtract = cards;
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.showMessage(error.message, 'error');
        
        this.isLoading = false;
      }
    });
  }

  onCreateCard(): void {
    if (this.cardForm.valid) {
      const formData = this.cardForm.value;

      this.isLoading = true;

      const cardData: Card = {
        name: formData.name,
        active: formData.active,
        flag: formData.flag,
        userId: this.user!.id
      }

      this.cardService.createCard(cardData).subscribe({
        next: (card) => {
          this.getCards();
          
          this.showCreateCardModal = false;
          
          this.isLoading = false;
          
          this.notificationService.showMessage('Cartão criado com sucesso!', 'success');
        },
        error: (error) => {
          this.isLoading = false;
          
          this.notificationService.showMessage(error.message, 'error');
        }
      });
    }
  }

  toggleCardExpenssesDeleteModal(cardExpensses?: CardExpensses): void {
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
          this.getCards();
          
          this.showDeleteCardExpenssesModal = false;
          
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
}
