import { Component, inject, OnInit, signal, HostListener, ElementRef, ViewChildren, QueryList, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../components/notification/notification.component';
import { NotificationService } from '../../infra/notification/notification.service';
import { Router } from '@angular/router';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { UserService } from '../../infra/user/user.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule,
    MatButtonModule,
    NotificationComponent,
    LoaderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [
    { provide: UserGateway, useClass: UserService},
    { provide: NotificationService, useClass: NotificationService }
  ],
  animations: [
    // Hero aparecer suavemente
    trigger('heroAnimation', [
      state('hidden', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('hidden => visible', animate('1000ms ease-out'))
    ]),
    
    // Fade In com movimento para cima
    trigger('fadeInUp', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(30px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hidden => visible', animate('800ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),

    // Fade In simples
    trigger('fadeIn', [
      state('hidden', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('hidden => visible', animate('600ms ease-out'))
    ]),

    // Scale In para items
    trigger('scaleIn', [
      state('hidden', style({
        opacity: 0,
        transform: 'scale(0.8)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('hidden => visible', animate('500ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),

    // Slide da esquerda
    trigger('slideInLeft', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateX(-40px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      transition('hidden => visible', animate('500ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),

    // Slide de baixo para cima
    trigger('slideInUp', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(50px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hidden => visible', animate('600ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    
    // Animação dos cards de preview - efeito 3D
    trigger('cardAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(60px) rotateX(20deg) scale(0.9)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0) rotateX(0) scale(1)'
      })),
      transition('hidden => visible', animate('700ms cubic-bezier(0.34, 1.56, 0.64, 1)'))
    ]),
    
    // Animação dos benefícios - bounce effect
    trigger('benefitAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(40px) scale(0.8)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      })),
      transition('hidden => visible', animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'))
    ]),

    // Fade In + Scale para CTA final
    trigger('fadeInScale', [
      state('hidden', style({
        opacity: 0,
        transform: 'scale(0.9)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('hidden => visible', animate('800ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),

    // Animação do botão CTA - pulse e glow
    trigger('ctaAnimation', [
      transition('* => pulse', [
        animate('1.2s cubic-bezier(0.4, 0, 0.2, 1)', keyframes([
          style({ transform: 'scale(1)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(199, 125, 255, 0.4)', offset: 0 }),
          style({ transform: 'scale(1.08)', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(199, 125, 255, 0.7)', offset: 0.5 }),
          style({ transform: 'scale(1)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(199, 125, 255, 0.4)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, AfterViewInit {
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  hidePassword: boolean = true;
  isLoading = false;
  showSignup = false;
  showAuthForms = false;

  // Estados de animação
  heroState = 'hidden';
  showSubtitle = false;
  showCTA = false;
  showScrollIndicator = false;
  previewCardsState = ['hidden', 'hidden', 'hidden'];
  benefitsState = ['hidden', 'hidden', 'hidden', 'hidden'];
  sectionHeadersState = ['hidden', 'hidden'];
  finalCTAState = 'hidden';
  ctaState = 'idle';

  // Typewriter effect
  fullText = 'Bem-vindo à sua plataforma de controle financeiro';
  displayedText = '';
  isTyping = true;
  private typingSpeed = 60; // ms por caractere

  // Dados fictícios para preview da experiência
  previewData = {
    balance: {
      income: 5420.50,
      expense: 3215.80,
      total: 2204.70
    },
    recentTransactions: [
      { description: 'Salário', value: 5000, type: 'income', icon: 'trending_up' },
      { description: 'Aluguel', value: -1200, type: 'expense', icon: 'home' },
      { description: 'Supermercado', value: -450.30, type: 'expense', icon: 'shopping_cart' }
    ],
    categories: [
      { name: 'Moradia', percentage: 38, color: '#C77DFF' },
      { name: 'Alimentação', percentage: 25, color: '#9D4EDD' },
      { name: 'Transporte', percentage: 15, color: '#7209B7' }
    ]
  };

  benefits = [
    {
      icon: 'insights',
      title: 'Visão Completa',
      description: 'Dashboard interativo com todas as suas finanças em tempo real'
    },
    {
      icon: 'category',
      title: 'Categorização Smart',
      description: 'IA organiza seus gastos automaticamente por categoria'
    },
    {
      icon: 'trending_up',
      title: 'Analytics Avançado',
      description: 'Gráficos e insights que revelam padrões ocultos nos seus gastos'
    },
    {
      icon: 'security',
      title: 'Segurança Total',
      description: 'Criptografia de ponta a ponta e autenticação em duas etapas'
    }
  ];

  @ViewChildren('previewCard') previewCards!: QueryList<ElementRef>;
  @ViewChildren('benefitItem') benefitItems!: QueryList<ElementRef>;
  @ViewChild('previewSection') previewSection!: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserGateway,
    private notificationService: NotificationService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.startAnimationSequence();
  }

  ngAfterViewInit(): void {
    // Configura IntersectionObserver para animar elementos ao scroll
    this.setupScrollAnimations();
  }

  /**
   * Sequência de animações da hero section
   * 1. Fade in do hero container
   * 2. Typewriter effect no título
   * 3. Fade in do subtitle
   * 4. Fade in do CTA
   * 5. Fade in do scroll indicator
   */
  private async startAnimationSequence(): Promise<void> {
    // 1. Hero container fade in
    setTimeout(() => {
      this.heroState = 'visible';
    }, 300);

    // 2. Typewriter effect (começa após 800ms)
    setTimeout(() => {
      this.startTypewriter();
    }, 800);
  }

  /**
   * Efeito typewriter - texto aparece letra por letra da esquerda para direita
   */
  private startTypewriter(): void {
    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < this.fullText.length) {
        this.displayedText += this.fullText[currentIndex];
        currentIndex++;
        setTimeout(typeNextChar, this.typingSpeed);
      } else {
        // Typewriter completo
        this.isTyping = false;
        
        // Mostra subtitle após 400ms
        setTimeout(() => {
          this.showSubtitle = true;
          
          // Mostra CTA após 600ms
          setTimeout(() => {
            this.showCTA = true;
            
            // Mostra scroll indicator após 800ms
            setTimeout(() => {
              this.showScrollIndicator = true;
            }, 800);
          }, 600);
        }, 400);
      }
    };

    typeNextChar();
  }

  buildForm(): void {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });

    this.signupForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]+$'), Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  /**
   * Configura IntersectionObserver para animar elementos conforme aparecem na tela
   * Cria animações progressivas baseadas em scroll
   */
  private setupScrollAnimations(): void {
    const options = {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Anima section headers
          if (element.classList.contains('section-header')) {
            const sectionIndex = parseInt(element.getAttribute('data-section') || '0');
            setTimeout(() => {
              this.sectionHeadersState[sectionIndex] = 'visible';
            }, 100);
          }
          
          // Anima preview cards com delay escalonado
          if (element.classList.contains('preview-card')) {
            const index = parseInt(element.getAttribute('data-index') || '0');
            setTimeout(() => {
              this.previewCardsState[index] = 'visible';
            }, index * 200); // 200ms entre cada card
          }
          
          // Anima benefícios com delay escalonado
          if (element.classList.contains('benefit-item')) {
            const index = parseInt(element.getAttribute('data-index') || '0');
            setTimeout(() => {
              this.benefitsState[index] = 'visible';
            }, index * 150); // 150ms entre cada benefício
          }

          // Anima CTA final
          if (element.classList.contains('cta-content')) {
            setTimeout(() => {
              this.finalCTAState = 'visible';
            }, 200);
          }

          observer.unobserve(element);
        }
      });
    }, options);

    // Observa section headers
    const sectionHeaders = this.elementRef.nativeElement.querySelectorAll('.section-header');
    sectionHeaders.forEach((header: HTMLElement, index: number) => {
      header.setAttribute('data-section', index.toString());
      observer.observe(header);
    });

    // Observa preview cards
    setTimeout(() => {
      this.previewCards?.forEach((card) => {
        observer.observe(card.nativeElement);
      });
    }, 100);

    // Observa benefícios
    setTimeout(() => {
      this.benefitItems?.forEach((item) => {
        observer.observe(item.nativeElement);
      });
    }, 100);

    // Observa CTA final
    const ctaContent = this.elementRef.nativeElement.querySelector('.cta-content');
    if (ctaContent) {
      observer.observe(ctaContent);
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Scroll suave até a seção de preview
   */
  scrollToPreview(): void {
    this.previewSection?.nativeElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  /**
   * Exibe formulários de autenticação com scroll suave
   */
  scrollToAuth(): void {
    this.showAuthForms = true;
    
    setTimeout(() => {
      const authSection = this.elementRef.nativeElement.querySelector('.auth-section');
      authSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  /**
   * Anima CTA com efeito pulse + glow
   */
  animateCTA(): void {
    this.ctaState = 'pulse';
    setTimeout(() => {
      this.ctaState = 'idle';
    }, 1200);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const formData = this.loginForm.value;

      this.userService.login(formData).subscribe(
        (response) => {
          this.userService.setUser(response);
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        }, (error) => {
          this.isLoading = false;
          this.notificationService.showMessage(error.error.message, 'error');
        }
      );
    }
  }

  async onSignupSubmit(): Promise<void> {
    if (this.signupForm.valid) {
      this.isLoading = true;

      const formData = this.signupForm.value;

      this.userService.createUser(formData).subscribe(
        () => {
          this.userService.login({
            email: formData.email,
            password: formData.password
          }).subscribe(
            (response) => {
              this.userService.setUser(response);
              this.isLoading = false;
              this.router.navigate(['/dashboard']);
            }, (error) => {
              this.isLoading = false;
              this.notificationService.showMessage(error.error.message, 'error');
            }
          );
        }, (error) => {
          this.isLoading = false;
          this.notificationService.showMessage(error.error.message, 'error');
        }
      );
    }
  }
}