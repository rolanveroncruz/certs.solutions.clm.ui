import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AgentsService } from '../../services/agents-service';
import {
    AgentResponse,
    ServiceData,
    DomainData,
    AgentCertificateRowFlat,
} from '../../services/agents.model';

import { CertsService } from '../../services/certs-service';
import {
    CertRequestModalComponent,
    CertRequestModalData,
    CertRequestModalResult
} from './cert-request-modal-component/cert-request-modal-component';
import { LoginService } from '../../services/login-service';
import {MatDialog} from '@angular/material/dialog';
import {RenewalConfigurationService} from '../../services/renewal-configuration-service';
import {GenericDataTableComponent} from '../../components/generic-data-table-component/generic-data-table-component';
import {TableColumn} from '../../components/generic-data-table-component/table-interfaces';
import {MatButton} from '@angular/material/button';


@Component({
    selector: 'app-agents',
    templateUrl: './agents-component.html',
    imports: [
        DatePipe,
        GenericDataTableComponent,
        MatButton,
    ],
    styleUrls: ['./agents-component.scss'],
    standalone: true
})
export class AgentsComponent implements OnInit {
    private readonly loginService = inject(LoginService);
    private readonly certsService = inject(CertsService);
    private readonly renewalConfigService = inject(RenewalConfigurationService);
    private readonly dialog=inject(MatDialog);
    private readonly agentsService = inject(AgentsService);

    expandedAgentId: string | null = null;
    viewMode = signal<'cards' | 'table'>('table');

    loading = signal(false);
    agents = signal<AgentResponse[]>([]);
    tableRows = signal<AgentCertificateRowFlat[]>([]);

    private progressTimerId: ReturnType<typeof setInterval> |null = null;
    requestProgress = signal({
        visible: false,
        secondsLeft: 30,
        messageIndex: 0,
    });
// Define table columns without action buttons for this milestone
    columnDefs: TableColumn<AgentCertificateRowFlat>[] = [
        { key: 'hostname', label: 'Host / Agent', sortable: true },
        { key: 'isOnline', label: 'Online', cellTemplateKey: 'check', sortable: true },
        { key: 'serviceName', label: 'Service', sortable: true },
        { key: 'domainName', label: 'Domain / Endpoint', sortable: true },
        { key: 'certIssuer', label: 'Issuer', sortable: true },
        { key: 'certExpiry', label: 'Expiration', cellTemplateKey: 'date', sortable: true },
        { key: 'certIsPresent', label: 'Present', cellTemplateKey: 'check', sortable: true },
        { key: 'certIsManaged', label: 'Managed', cellTemplateKey: 'check', sortable: true },
        { key: 'renewalConfigurationName', label: 'Renewal Group', sortable: true },
        { key: 'actions', label: 'Actions', cellTemplateKey: 'actionsSmallFonts', sortable:false,
         actionButton: {
            label: (row:AgentCertificateRowFlat)=>row.certIsManaged? 'Renew':'Request',
             icon: (row:AgentCertificateRowFlat)=> row.certIsManaged? 'autorenew': 'add_moderator',
             color: "primary",
             onClick: ()=>{}

         }}
    ];

    requestProgressMessages = [
        "Requesting Server to Generate Private Key",
        "Generating a Certificate Signing Request (CSR)",
        "Sending CSR to CA for Signing",
        "Waiting for CA to Sign Certificate",
        "Certificate Signed Successfully!",
        "Installing Certificate on Server",
        "Verifying Certificate Installation",
        "Certificate Installation Successful!"
    ]

    constructor() {}

    ngOnInit(): void {
        this.loadAgents();
    }

    loadAgents(): void {
        const clientId = this.loginService.clientId();

        this.loading.set(true);

        // Fetch raw objects for card view
        this.agentsService.listAgents(clientId).subscribe({
            next: (data) => {
                this.agents.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load agents', err);
                this.loading.set(false);
            },
        });

        // Fetch flattened rows directly for our new table view
        this.agentsService.listAgentsAsRows(clientId).subscribe({
            next: (rows) => {
                this.tableRows.set(rows);
                console.log("Table Rows:", this.tableRows())
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load flat agent rows', err);
                this.loading.set(false);
            },
        });
    }

    toggleAgent(id: string): void {
        this.expandedAgentId = this.expandedAgentId === id ? null : id;
    }

    // requestCertificate is called to: Enroll a new certificate or renew an old one.
    requestCertificate(
        agent: AgentResponse,
        _: ServiceData,
        domain: DomainData,
    ): void {
        const dialogRef = this.dialog.open<CertRequestModalComponent,
            CertRequestModalData,
            CertRequestModalResult
        >(CertRequestModalComponent, {
            width: '750px',
            maxWidth: '95vw',
            data:{
                agentId: agent.id,
                domainName: domain.domain_name,
                mode: domain.certificate?.is_managed? 'renew': 'request',
                registryCertId: domain.certificate?.registry_certificate_id ?? undefined
            }
        });
        dialogRef.afterClosed().subscribe( (payload ) =>{
            if (payload && payload.acquireRequest){
                this.certsService.acquireCert(payload.acquireRequest).subscribe({

                    next:()=>{
                        // We have made a successful certificate request, but actual enrollment is still pending.
                        this.startRequestProgressBanner();
                        if (payload.configId && payload.registryCertId){
                            this.renewalConfigService.patchCertificate(payload.registryCertId, payload.configId).subscribe({
                                next:()=> {
                                    this.loadAgents();
                                },
                                error: (err)=>{
                                    console.error('Failed to assign renewal configuration', err);
                                    alert('Failed to assign renewal configuration');
                                }
                            })
                        }
                    },
                    error: (err)=>{
                        console.error('Failed to acquire certificate', err);
                        alert('Failed to acquire certificate');
                    }
                })
            }
        });
    }


    openManageConfigDialog(
        agent: AgentResponse,
        domain: DomainData
    ): void {
        console.log("agent:", agent);
        console.log("registry_certificate_id:", domain.certificate?.registry_certificate_id);
        const dialogRef = this.dialog.open<CertRequestModalComponent,
            CertRequestModalData,
            CertRequestModalResult
        >(CertRequestModalComponent, {
            width: '750px',
            maxWidth: '95vw',
            data: {
                agentId: agent.id,
                domainName: domain.domain_name,
                mode: 'manageConfig',
                currentConfigId: domain.certificate?.renewal_configuration_id ?? undefined,
                registryCertId: domain.certificate?.registry_certificate_id ?? undefined
            }
        });

        dialogRef.afterClosed().subscribe((payload)=> {
            if (payload?.configId && payload?.registryCertId) {
                this.renewalConfigService.patchCertificate(payload.registryCertId, payload.configId).subscribe({
                    next:()=>{
                        this.loadAgents();
                    },
                    error: (err)=>{
                        console.error('Failed to assign renewal configuration', err);
                        alert('Failed to assign renewal configuration');
                    }
                })
            }
        });
    }

    startRequestProgressBanner():void{
        this.stopRequestProgressBanner();

        const totalSeconds = 30;
        const messageDuration = totalSeconds/this.requestProgressMessages.length;

        this.requestProgress.set({
            visible: true,
            secondsLeft: totalSeconds,
            messageIndex: 0,
        });

        this.progressTimerId = setInterval(()=>{
            const current = this.requestProgress();
            const nextSecondsLeft = current.secondsLeft - 1;

            const nextMessageIndex =
                Math.floor((totalSeconds - nextSecondsLeft)/messageDuration)
                % this.requestProgressMessages.length;

            this.requestProgress.set({
                visible: nextSecondsLeft > 0,
                secondsLeft: Math.max(nextSecondsLeft, 0),
                messageIndex: nextMessageIndex
            });

            if (nextSecondsLeft <= 0) {
                this.stopRequestProgressBanner();
                this.loadAgents();
            }
        }, 1000)
    }

    stopRequestProgressBanner():void{
        if (this.progressTimerId) {
            clearInterval(this.progressTimerId);
            this.progressTimerId = null;
        }

        this.requestProgress.set({
            visible: false,
            secondsLeft: 0,
            messageIndex: 0,
        });
    }

    // Helper method to look up and reconstruct nested domain trees from primitive IDs
    private findMatchingDataFromRow(row: AgentCertificateRowFlat): { agent: AgentResponse; service: ServiceData; domain: DomainData } | null { // 🟩
        const agent = this.agents().find(a => a.id === row.agentId); // 🟩
        if (!agent) return null; // 🟩
        // 🟩
        const service = agent.services.find(s => s.service_id === row.serviceId); // 🟩
        if (!service) return null; // 🟩
        // 🟩
        const domain = service.domains.find(d => d.domain_name === row.domainName); // 🟩
        if (!domain) return null; // 🟩
        // 🟩
        return { agent, service, domain }; // 🟩
    } // 🟩

    tablePrimaryActionHandler(row: AgentCertificateRowFlat): void { // 🟩
        const context = this.findMatchingDataFromRow(row); // 🟩
        if (context) { // 🟩
            this.requestCertificate(context.agent, context.service, context.domain); // 🟩
        } // 🟩
    } // 🟩

    tableSecondaryActionHandler(row: AgentCertificateRowFlat): void { // 🟩
        const context = this.findMatchingDataFromRow(row); // 🟩
        if (context) { // 🟩
            this.openManageConfigDialog(context.agent, context.domain); // 🟩
        } // 🟩
    } // 🟩

    // Hides the "Manage" configuration button entirely if a domain doesn't even have a registry certificate footprint
    shouldHideManageAction(row: AgentCertificateRowFlat): boolean { // 🟩
        return !row.registryCertificateId; // 🟩
    } // 🟩
}
