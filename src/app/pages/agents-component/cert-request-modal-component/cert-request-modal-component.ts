import {Component, OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcquireCertRequest} from '../../../services/certs.model'
import {MatTab, MatTabGroup,MatTabsModule} from '@angular/material/tabs';
import {ConfigSelectorComponent} from '../../../components/config-selector-component/config-selector-component';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {CertsService, ListProvidersRow} from '../../../services/certs-service';

export interface CertRequestModalData {
    agentId: string;
    domainName: string;
    mode?: 'request' | 'manageConfig' | 'renew';
    currentConfigId?:string;
    registryCertId?:string;
    currentProviderId?:string;
}
export interface CertRequestModalResult {
    configId: string | null;
    registryCertId?: string;
    acquireRequest?: AcquireCertRequest;
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
    private readonly dialogRef = inject(MatDialogRef<CertRequestModalComponent, CertRequestModalResult>);
    private readonly certService = inject(CertsService);
    readonly data = inject<CertRequestModalData>(MAT_DIALOG_DATA);
    readonly registryCertId = this.data.registryCertId;

    selectedConfigId:string | null = null;
    isConfigCreating: boolean = false;
    providers = signal<ListProvidersRow[]>([]);

    // Define the form group with validation
    certForm = this.fb.group({
        provider_id:['', [Validators.required]],
        domain_name: ['', [Validators.required, Validators.minLength(3)]],
        organization: [''],
        country: ['', [Validators.maxLength(2), Validators.pattern(/^[A-Z]{2}$/i)]],
        province: [''],
        locality: [''],
        sans: [''],
        email_address: ['', [Validators.email]]
    });

    ngOnInit(): void {
        // Autopopulate based on the discovered service info
        console.log('registry_certificate_id', this.data.registryCertId);
        this.certForm.patchValue({
            domain_name: this.data.domainName,
        });
        this.certService.getProviderList().subscribe({
            next: (providers)=>{
                this.providers.set(providers);
                let defaultProvider = providers.find(p=>p.id===this.data.currentProviderId);

                if(!defaultProvider){
                    defaultProvider = providers.find(p=>p.name.toLowerCase()==='globalsign');
                }
                if (defaultProvider){
                    this.certForm.patchValue({provider_id: defaultProvider.id})
                }
            },
            error: (err)=> console.log('Failed to load CA providers:', err)
        })

        setTimeout(()=>{
           const textarea = document.getElementById('sans') as HTMLTextAreaElement;
           if (textarea) this.autoResize({target:textarea } as any);
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
            this.dialogRef.close({
                configId:this.selectedConfigId,
                registryCertId: this.registryCertId});
            return;
        }

        if (this.certForm.valid) {
            const formValue = this.certForm.value;

            const parsedSansArray: string[] = formValue.sans
                ? String(formValue.sans)
                    .split(/[,\n;]+/)
                    .map((domain:string)=>domain.trim())
                    .filter(( domain:string)=>domain.length>0)
                : [];

            const acquireRequest: AcquireCertRequest = {
                agent_id: this.data.agentId,
                provider_id: formValue.provider_id?? '',
                domain_name: formValue.domain_name ?? '',
                organization: formValue.organization ?? undefined,
                country: formValue.country ?? undefined,
                province: formValue.province ?? undefined,
                locality: formValue.locality ?? undefined,
                email_address: formValue.email_address ?? undefined,
                sans: parsedSansArray,
                renewal_configuration_id: this.selectedConfigId,
            };

            this.dialogRef.close({
                acquireRequest: acquireRequest,
                configId:this.selectedConfigId,
                registryCertId: this.registryCertId,
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
    onConfigSelect(configId:string): void{
        this.selectedConfigId = configId;
    }
    // cert-request-modal-component.ts

    autoResize(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;

       // 1. Reset height to 'auto' so it shrinks when text is deleted
        textarea.style.height = 'auto';

       // 2. Set the height to the scrollHeight (total content height)
        textarea.style.height = textarea.scrollHeight + 'px';
    }
}

