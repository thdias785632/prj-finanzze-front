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
    // Esconde navbar/bottom-nav em rotas públicas (inclui o primeiro load)
    const publicRoutes = ['/'];

    this.showNav = !publicRoutes.includes(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showNav = !publicRoutes.includes(event.url);
      }
    });
  }
}