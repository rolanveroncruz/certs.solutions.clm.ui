import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ChangePasswordService} from './change-password-service';
import {FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null { // ✅
    const value = control.value || '';
    const errors: ValidationErrors = {};

    // Test each rule individually and assign a specific error key if it fails
    if (value.length < 8) errors['minLength'] = true;
    if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
    if (!/[0-9]/.test(value)) errors['number'] = true;
    if (!/[^a-zA-Z0-9]/.test(value)) errors['special'] = true;

    // If there are any errors, return the object; otherwise return null (valid)
    return Object.keys(errors).length ? errors : null;
}

export function passwordMatchValidator(control: AbstractControl) : ValidationErrors | null{
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password === confirm ? null : {mismatch: true};
}

@Component({
  selector: 'app-change-password',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
    ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly changePasswordService = inject(ChangePasswordService);
    private fb = inject(FormBuilder);

    // Required signals and properties
    uuidIsValid = signal<boolean>(false);
    uuidIsValidMessage = signal<string|null>(null);
    userUuid: string | null = null;

    // Add signals to track password visibility
    hidePassword = signal<boolean>(true);
    hideConfirm = signal<boolean>(true);

    // Define the Reactive Form with validation rules
    passwordForm = this.fb.group({ // ✅
        password: ['', [
            Validators.required,
            passwordStrengthValidator
        ]],
        confirmPassword: ['', Validators.required] // ✅
    }, { validators: passwordMatchValidator }); // ✅ Apply the matching validator to the whole group

    ngOnInit(): void{
        this.userUuid = this.route.snapshot.paramMap.get('req_uuid');

        if(this.userUuid){
            console.log("userUuid:", this.userUuid);
        }

        this.changePasswordService.validateToken(this.userUuid!).subscribe({
            next: (response) => {
                console.log("Token validation response:", response);
                this.uuidIsValid.set(response.valid);
                this.uuidIsValidMessage.set(response.message);
            },
            error: (error) => {
                console.error("Error validating token:", error);
                this.uuidIsValidMessage.set("An error occurred while validating the token.");
            }
        });
    }

    // ✅ Form submission handler
    onSubmit(): void { // ✅
        if (this.passwordForm.valid) {
            const newPassword = this.passwordForm.value.password;
            console.log("Ready to submit new password via service!");
            this.changePasswordService.changePassword(this.userUuid!, newPassword!).subscribe({
                next: (response) => {
                    console.log("Password change response:", response);
                    this.uuidIsValid.set(false);
                    this.uuidIsValidMessage.set("Password changed successfully.");
                },
                error: (error) => {
                    console.error("Error changing password:", error);
                    this.uuidIsValidMessage.set("An error occurred while changing the password.");
                }
            })
        }
    }
}
