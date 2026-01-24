import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    NavbarComponent,
    BottomNavComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  showNav = true;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Esconde bottom-nav em rotas públicas
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const publicRoutes = ['/'];
        this.showNav = !publicRoutes.includes(event.url);
      }
    });
  }
}