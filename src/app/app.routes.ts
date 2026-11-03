import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { DashboardGuard } from './guards/dashboard.guard';
import { ExtractComponent } from './views/extract/extract.component';
import { CardComponent } from './views/card/card.component';
import { ImoveisComponent } from './views/imoveis/imoveis.component';
import { ImovelDetalheComponent } from './views/imovel-detalhe/imovel-detalhe.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [DashboardGuard] },
  { path: 'extract', component: ExtractComponent, canActivate: [DashboardGuard] },
  { path: 'card', component: CardComponent, canActivate: [DashboardGuard] },
  { path: 'imoveis', component: ImoveisComponent, canActivate: [DashboardGuard] },
  { path: 'imoveis/:id', component: ImovelDetalheComponent, canActivate: [DashboardGuard] },
  { path: '**', redirectTo: '' }
];
