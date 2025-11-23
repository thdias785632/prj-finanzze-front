import { Component, inject, OnInit, signal } from '@angular/core';
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
  ]
})
export class HomeComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword: boolean = true;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserGateway,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
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
}
