import {Component, inject, signal} from '@angular/core';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';

import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';

// (A) ADDED: router (optional, for redirect after login)
import {Router} from '@angular/router';
import {LoginService} from '../services/login-service';
import {firstValueFrom} from 'rxjs';

@Component({
    selector: 'app-login-component',
    imports: [
        MatCard,
        MatCardHeader,
        MatIcon,
        MatCardContent,
        MatFormField,
        MatLabel,
        MatSuffix,
        MatButton,
        MatCardActions,
        MatInput,
        MatIconButton,
        ReactiveFormsModule,
    ],
    templateUrl: './login-component.html',
    styleUrl: './login-component.scss',
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder).nonNullable;
    private loginService = inject(LoginService);
    private router = inject(Router);

    currentYear = new Date().getFullYear();

    hidePassword = signal(true);
    isSubmitting = signal(false);
    errorText = signal<string | null>(null);

    readonly form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
        rememberMe: [false]
    })

    togglePasswordVisibility(): void {
        this.hidePassword.set(!this.hidePassword());
    }

    async onSubmit(event?: Event): Promise<void> {
        this.errorText.set(null);
        console.log("In Login Component, onSubmit");
        event?.preventDefault();

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (this.isSubmitting()) return;
        this.isSubmitting.set(true);

        const {email, password} = this.form.getRawValue();

        this.loginService.login(email ?? '', password ?? '').subscribe({
            next: (response) => {
                console.log("Login response: ", response);
                if (this.loginService.isLoggedIn()) {
                    console.log("Login successful. Navigating to dashboard.");
                    this.router.navigateByUrl('/main/dashboard').then();
                } else {
                    console.log("Login failed.");
                }
            },
            error: (error: any) => {
                console.log("Login failed:", error);
                if (error?.status === 401) {
                    this.errorText.set("Unauthorized: " + error.error.message );
                } else {
                    this.errorText.set("An unexpected error occurred.");
                }
                this.isSubmitting.set(false);
            },
            complete: () => {
                this.isSubmitting.set(false);
            }
        })
    }
}
