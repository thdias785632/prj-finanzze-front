import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [
    MatIconModule,
    RouterModule,
    CommonModule
  ],
})
export class NavbarComponent implements OnInit {
  @Input() header: string = '';
  menuOpen: boolean = false;
  routes!: any[]

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routes = [
      {
        label: 'Resumo',
        path: '/dashboard'
      },
      {
        label: 'Extrato',
        path: '/extract'
      },
      {
        label: 'Cartões',
        path: '/card'
      }
    ];
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    localStorage.removeItem('@Finnanze:User');

    this.router.navigate(['']).then(() => {
      window.location.reload();
    });
  }
}
