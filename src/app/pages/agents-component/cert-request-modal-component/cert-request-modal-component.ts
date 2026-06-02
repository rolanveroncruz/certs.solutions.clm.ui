import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcquireCertRequest} from '../../../services/certs.model'
import {MatTab, MatTabGroup,MatTabsModule} from '@angular/material/tabs';
import {ConfigSelectorComponent} from '../../../components/config-selector-component/config-selector-component';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

export interface CertRequestModalData {
    agentId: string;
    domainName: string;
    mode?: 'request' | 'manageConfig';
    currentConfigId?:string;
}
@Component({
    selector: 'app-cert-request-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTabGroup,
        MatTab,
        MatTabsModule,
        MatDialogModule,
        ConfigSelectorComponent,
    ],
    templateUrl: './cert-request-modal-component.html',
    styleUrls: ['./cert-request-modal-component.scss']
})
export class CertRequestModalComponent implements OnInit {
    private fb = inject(FormBuilder);
    private readonly dialogRef = inject(MatDialogRef<CertRequestModalComponent>);
    readonly data = inject<CertRequestModalData>(MAT_DIALOG_DATA);

    selectedConfigId:string | null = null;

    // Define the form group with validation
    certForm = this.fb.group({
        domain_name: ['', [Validators.required, Validators.minLength(3)]],
        organization: [''],
        country: ['', [Validators.maxLength(2), Validators.pattern(/^[A-Z]{2}$/i)]],
        province: [''],
        locality: [''],
        email_address: ['', [Validators.email]]
    });

    ngOnInit(): void {
        // Autopopulate based on the discovered service info
        this.certForm.patchValue({
            domain_name: this.data.domainName,
        });

        if (this.data.mode === 'manageConfig'){
            this.certForm.disable();
        }
        if (this.data.currentConfigId){
            this.selectedConfigId = this.data.currentConfigId;
        }
    }

    onSubmit(): void {
        if (this.data.mode === 'manageConfig'){
            this.dialogRef.close({configId:this.selectedConfigId});
            return;
        }
        if (this.certForm.valid) {
            const formValue = this.certForm.value;

            const payload: AcquireCertRequest = {
                agent_id: this.data.agentId,
                domain_name: formValue.domain_name ?? '',
                organization: formValue.organization ?? undefined,
                country: formValue.country ?? undefined,
                province: formValue.province ?? undefined,
                locality: formValue.locality ?? undefined,
                email_address: formValue.email_address ?? undefined
            };

            this.dialogRef.close(payload);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
    onConfigSelect(configId:string): void{
        this.selectedConfigId = configId;
    }
}

