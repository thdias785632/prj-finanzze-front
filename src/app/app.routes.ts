import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { DashboardGuard } from './guards/dashboard.guard';
import { ExtractComponent } from './views/extract/extract.component';
import { CardComponent } from './views/card/card.component';
import { InvestimentoComponent } from './views/investimento/investimento.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [DashboardGuard] },
  { path: 'extract', component: ExtractComponent, canActivate: [DashboardGuard] },
  { path: 'card', component: CardComponent, canActivate: [DashboardGuard] },
  { path: 'investimento', component: InvestimentoComponent, canActivate: [DashboardGuard] },
  { path: '**', redirectTo: '' }
];
