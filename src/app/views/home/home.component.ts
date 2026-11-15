import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BloomBeltComponent } from '../../components/bloom-belt/bloom-belt.component';
import { LoaderComponent } from '../../components/loader/loader.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { NotificationService } from '../../infra/notification/notification.service';
import { UserGateway } from '../../domain/user/gateway/user.gateway';
import { UserService } from '../../infra/user/user.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    BloomBeltComponent,
    LoaderComponent,
    NotificationComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [
    { provide: UserGateway, useClass: UserService },
    { provide: NotificationService, useClass: NotificationService }
  ]
})
export class HomeComponent implements OnInit {
  @ViewChild('authSection') authSection?: ElementRef<HTMLElement>;

  mode: AuthMode = 'login';
  hidePassword = true;
  isLoading = false;

  loginForm!: FormGroup;
  signupForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserGateway,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForms();
  }

  private buildForms(): void {
    this.loginForm = this.fb.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });

    this.signupForm = this.fb.group({
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[A-Za-zÀ-ÿ' ]+$/)
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });
  }

  get activeForm(): FormGroup {
    return this.mode === 'login' ? this.loginForm : this.signupForm;
  }

  setMode(mode: AuthMode): void {
    if (this.mode === mode) return;

    this.mode = mode;
    this.hidePassword = true;
    this.activeForm.markAsUntouched();
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  scrollToAuth(): void {
    this.authSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  errorFor(controlName: string): string {
    const control = this.activeForm.get(controlName);

    if (!control || !control.touched || control.valid) return '';

    if (control.hasError('required')) {
      return controlName === 'name' ? 'Informe seu nome'
        : controlName === 'email' ? 'Informe seu e-mail'
        : 'Informe sua senha';
    }

    if (control.hasError('email')) return 'E-mail inválido';

    if (control.hasError('minlength')) {
      const min = control.getError('minlength').requiredLength;
      return `Mínimo de ${min} caracteres`;
    }

    if (control.hasError('pattern')) return 'Use apenas letras';

    return 'Valor inválido';
  }

  onSubmit(): void {
    if (this.mode === 'login') {
      this.submitLogin();
      return;
    }

    this.submitSignup();
  }

  private submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.userService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.userService.setUser(response);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(
          error?.error?.message || 'Não foi possível entrar',
          'error'
        );
      }
    });
  }

  private submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formData = this.signupForm.value;

    this.userService.createUser(formData).subscribe({
      next: () => {
        this.userService.login({
          email: formData.email,
          password: formData.password
        }).subscribe({
          next: (response) => {
            this.userService.setUser(response);
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.showMessage(
              error?.error?.message || 'Conta criada, mas o login falhou',
              'error'
            );
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showMessage(
          error?.error?.message || 'Não foi possível criar a conta',
          'error'
        );
      }
    });
  }
}
