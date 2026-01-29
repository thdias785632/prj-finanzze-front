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
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
  }
}