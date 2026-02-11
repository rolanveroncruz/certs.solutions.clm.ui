import {Component, inject, signal} from '@angular/core';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton, MatIconButton} from '@angular/material/button';

import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';

// (A) ADDED: router (optional, for redirect after login)
import {Router} from '@angular/router';
import {LoginService} from '../services/login-service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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
        MatCheckbox,
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

    hidePassword = signal(true);
    isSubmitting = signal(false);
    errorText: string | null = null;

    readonly form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
        rememberMe: [false]
    })

    togglePasswordVisibility(): void {
        this.hidePassword.set(!this.hidePassword());
    }
    async onSubmit(event?:Event): Promise<void> {
        console.log("In Login Component, onSubmit");
        event?.preventDefault();

        if (this.form.invalid){
            this.form.markAllAsTouched();
            return;
        }

        if (this.isSubmitting()) return;
        this.isSubmitting.set(true);

        try{
            const {email, password} = this.form.getRawValue();

            const response = await firstValueFrom(
                this.loginService.login(email ?? '', password ?? '')
            );
            console.log("Login response: ", response);
            if (this.loginService.isLoggedIn()) {
                console.log("Login successful. Navigating to dashboard.");
                await this.router.navigateByUrl('/main/dashboard').then();
            } else{
                console.log("Login failed.");
                this.errorText = 'Login failed.';
            }
        } catch (err:any){
            this.errorText = err?.message ?? 'Login failed.';
        } finally {
            this.isSubmitting.set(false);
        }

    }

    readonly currentYear = new Date().getFullYear();

}
