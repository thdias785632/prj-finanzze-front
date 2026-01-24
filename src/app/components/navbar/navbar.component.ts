import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, HostListener } from '@angular/core';
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
  userMenuOpen: boolean = false;

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    // Navbar não precisa mais das rotas (movidas para bottom-nav)
  }

  /**
   * Toggle do menu dropdown do usuário
   */
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  /**
   * Fecha dropdown ao clicar fora
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.user-icon');
    
    if (!clickedInside && this.userMenuOpen) {
      this.userMenuOpen = false;
    }
  }

  /**
   * Navega para perfil do usuário
   */
  goToProfile(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.userMenuOpen = false;
    localStorage.removeItem('@Finnanze:User');

    this.router.navigate(['']).then(() => {
      window.location.reload();
    });
  }
}