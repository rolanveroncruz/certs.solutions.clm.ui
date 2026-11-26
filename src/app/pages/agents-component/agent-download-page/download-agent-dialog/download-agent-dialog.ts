import {Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {AgentsService, GenerateEnrollmentTokenRequest} from '../../../../services/agents-service';
import {LoginService} from '../../../../services/login-service';

export interface DownloadAgentDialogData {
    downloadUrl: string;
}

@Component({
    selector: 'app-download-agent-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './download-agent-dialog.html',
    styleUrl: './download-agent-dialog.scss',
})
export class DownloadAgentDialog {
    private readonly fb = inject(FormBuilder);
    private readonly loginService = inject(LoginService);
    private readonly agentsService = inject(AgentsService);
    private readonly dialogRef = inject(MatDialogRef<DownloadAgentDialog>);
    private readonly data = inject<DownloadAgentDialogData>(MAT_DIALOG_DATA);

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        hostname: ['', [Validators.required]],
        group: ['', [Validators.required]],
    });

    download(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading.set(true);
        this.errorMessage.set(null);

        const raw = this.form.getRawValue();
        const payload: GenerateEnrollmentTokenRequest = {
            client_id: this.loginService.clientId(),
            hostname: raw.hostname.trim(),
            group: raw.group.trim(),
            ttl_minutes: 60,
        };

        this.agentsService.generateEnrollmentToken(payload).subscribe({
            next: (res) => {
                const url = `${this.data.downloadUrl}?token=${encodeURIComponent(res.token)}`;
                this.loading.set(false);
                window.open(url, '_blank');
                this.dialogRef.close(true);
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
