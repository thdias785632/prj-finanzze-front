import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserService } from '../../infra/user/user.service';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { User, UserExtract } from '../../domain/user/dto/user.dto';
import { LoaderComponent } from '../../components/loader/loader.component';
import { DashboardChartComponent } from '../../components/dashboard-chart/dashboard-chart.component';
import { formatDateToAmericanFormat } from '../../utils/date';
import { CardService } from '../../infra/card/card.service';
import { CardGateway } from '../../domain/card/gateway/card.gateway';
import { NotificationService } from '../../infra/notification/notification.service';
import { CardsExtract } from '../../domain/card/dto/card.dto';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    LoaderComponent,
    DashboardChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [
    { provide: UserGateway, useClass: UserService},
    { provide: CardGateway, useClass: CardService },
    { provide: NotificationService, useClass: NotificationService },
]
})
export class DashboardComponent implements OnInit {
    user: User | null = null;
    userExtract!: UserExtract;
    date: Date = new Date()
    isLoading: boolean = false;
    referenceDate: Date = new Date();
    cardsExtract: CardsExtract[] = [];
    categoriesGrouped!: {[key: string]: number};

    showImage: boolean = false;

    constructor(
        private userService: UserGateway,
        private cardService: CardGateway,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.user = this.userService.getUser();

        this.getUserExtract();

        this.getCards();
    }

    getUserExtract(): void {
        if (this.user) {
            this.isLoading = true;

            const formattedDate = formatDateToAmericanFormat(this.date);

            this.userService.getUserExtract(this.user.id, formattedDate).subscribe(
                (expenses) => {
                    this.userExtract = expenses;
                    
                    this.groupCategories();
                    
                    this.isLoading = false;

                    this.showImage = true;
                },
                () => {
                    this.isLoading = false;
                }
            );
        }
    }

    getCards(): void {
        this.isLoading = true;

        const formattedDate = formatDateToAmericanFormat(this.referenceDate);
        
        this.cardService.getCardsExtract(this.user!.id, formattedDate).subscribe({
        next: (cards) => {
            this.cardsExtract = cards;

            this.isLoading = false;
        },
        error: (error) => {
            this.notificationService.showMessage(error.message, 'error');
            
            this.isLoading = false;
        }
        });
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

        this.categoriesGrouped = Object.fromEntries(
            Object.entries(categoryMap).sort(([, a], [, b]) => b - a)
        );

        if (Object.keys(this.categoriesGrouped).length === 0) {
            this.categoriesGrouped = { 'Sem categorias': 1 }
        }
    }
}
