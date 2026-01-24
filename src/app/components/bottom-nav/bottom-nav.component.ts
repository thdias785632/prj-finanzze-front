import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

/**
 * Interface para definir rotas da bottom navigation
 */
interface NavRoute {
  path: string;
  label: string;
  icon: string;
  exact?: boolean; // Se true, ativa apenas com match exato
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule
  ],
})
export class BottomNavComponent implements OnInit {
  /**
   * Rotas da bottom navigation
   * Ícones do Material Icons: https://fonts.google.com/icons
   */
  routes: NavRoute[] = [
    {
      path: '/dashboard',
      label: 'Resumo',
      icon: 'dashboard',
      exact: true
    },
    {
      path: '/extract',
      label: 'Extrato',
      icon: 'receipt_long',
      exact: false
    },
    {
      path: '/card',
      label: 'Cartões',
      icon: 'credit_card',
      exact: false
    },
    // Adicione mais rotas conforme necessário
    // Exemplos de ícones úteis:
    // - analytics (Análises)
    // - account_balance_wallet (Carteira)
    // - savings (Investimentos)
    // - settings (Configurações)
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inicialização se necessário
  }

  /**
   * Callback ao clicar em uma rota
   * Útil para analytics ou lógica adicional
   */
  onRouteClick(route: NavRoute): void {
    // Você pode adicionar analytics aqui
    console.log(`Navegando para: ${route.label}`);
    
    // Exemplo de tracking (remova se não usar analytics):
    // this.analytics.track('bottom_nav_click', { route: route.path });
  }
}