import {Component, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ✅ adjust this import to your real service path/name
import {AgentsService, GenerateEnrollmentTokenRequest, GenerateEnrollmentTokenResponse} from '../../../services/agents-service';
import {LoginService} from '../../../services/login-service';


@Component({
    selector: 'app-generate-enrollment-token-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './generate-enrollment-token-dialog.html',
    styleUrl: './generate-enrollment-token-dialog.scss',
})
export class GenerateEnrollmentTokenDialog implements OnInit{
    ngOnInit(): void {
        const clientId = this.loginService.clientId();
        const clientName = this.loginService.clientName();
        this.form.patchValue({
            client_id:clientId,
            client_name:clientName,
        })
    }
    private readonly fb = inject(FormBuilder);
    private readonly loginService = inject(LoginService);
    private readonly agentsService= inject(AgentsService);
    private readonly dialogRef = inject(MatDialogRef<GenerateEnrollmentTokenDialog>);

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly response = signal<GenerateEnrollmentTokenResponse | null>(null);

    readonly form = this.fb.nonNullable.group({
        client_id: [{value:0, disabled:true}, [Validators.required, Validators.min(1)]],
        client_name: [{value:'', disabled:true}],
        hostname: ['', [Validators.required]],
        group: ['', [Validators.required]],
        ttl_minutes: [60, [Validators.required, Validators.min(1)]],
    });

    generateEnrollmentToken(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);
        this.response.set(null);

        const raw = this.form.getRawValue();
        const payload: GenerateEnrollmentTokenRequest={
            client_id: raw.client_id,
            group:  raw.group,
            hostname: raw.hostname,
            ttl_minutes:raw.ttl_minutes,
        } ;

        this.agentsService.generateEnrollmentToken(payload).subscribe({
            next: (res) => {
                this.response.set(res);
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.errorMessage.set('Failed to generate enrollment token.');
                this.loading.set(false);
            },
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
