import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcquireCertRequest} from '../../../services/certs.model'
import {AgentDiscoveryRes} from '../../../services/agents.model';

@Component({
    selector: 'app-cert-request-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './cert-request-modal-component.html',
    styleUrls: ['./cert-request-modal-component.scss']
})
export class CertRequestModalComponent implements OnInit {
    @Input({ required: true }) agentId!: string;
    @Input({ required: true }) discovery!: AgentDiscoveryRes;
    @Output() confirmed = new EventEmitter<AcquireCertRequest>();
    @Output() cancelled = new EventEmitter<void>();

    private fb = inject(FormBuilder);

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
        // Auto-populate based on the discovered service info
        this.certForm.patchValue({
            domain_name: this.discovery.commonName || this.discovery.serviceName
        });
    }

    onSubmit(): void {
        if (this.certForm.valid) {
            const formValue = this.certForm.value;

            const payload: AcquireCertRequest = {
                agent_id: this.agentId,
                domain_name: formValue.domain_name ?? '',
                organization: formValue.organization ?? undefined,
                country: formValue.country ?? undefined,
                province: formValue.province ?? undefined,
                locality: formValue.locality ?? undefined,
                email_address: formValue.email_address ?? undefined
            };

            this.confirmed.emit(payload);
        }
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
