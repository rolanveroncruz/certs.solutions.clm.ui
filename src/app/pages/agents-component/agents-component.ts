import {ActivatedRoute} from '@angular/router';
import {Component, computed, inject, OnInit, signal, TemplateRef, ViewChild} from '@angular/core';
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
import {NgOptimizedImage} from '@angular/common';


@Component({
    selector: 'app-agents',
    templateUrl: './agents-component.html',
    imports: [
        GenericDataTableComponent,
        NgOptimizedImage,
    ],
    styleUrls: ['./agents-component.scss'],
    standalone: true
})
export class AgentsComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly loginService = inject(LoginService);
    private readonly certsService = inject(CertsService);
    private readonly renewalConfigService = inject(RenewalConfigurationService);
    private readonly dialog=inject(MatDialog);
    private readonly agentsService = inject(AgentsService);

    @ViewChild('RenewBtn', { static: true }) RenewBtn!: TemplateRef<any>;
    @ViewChild('RequestBtn', { static: true }) RequestBtn!: TemplateRef<any>;
    @ViewChild('ManageBtn', { static: true }) ManageBtn!: TemplateRef<any>;

    loading = signal(false);
    agents = signal<AgentResponse[]>([]);
    allTableRows = signal<AgentCertificateRowFlat[]>([]);
    private currentFilter = signal<string | null>(null);
    tableRows = computed(()=>{
        const rows = this.allTableRows();
        const filter = this.currentFilter();

        if (!filter) return rows;
        const now = new Date();
        const thirtyDaysInMs = 30* 24 * 60 * 60 * 1000;

        return rows.filter( row=> {
            switch(filter){
                case 'online':
                    return row.isOnline;
                    case 'expiring':
                        if (!row.certExpiry) return false;
                        const expirationDate = new Date(row.certExpiry);
                        return expirationDate.getTime() - now.getTime() <= thirtyDaysInMs;
                case 'active':
                    return row.certIsManaged;
                        default:
                            return true;
            }
        })

    })

    private progressTimerId: ReturnType<typeof setInterval> |null = null;
    requestProgress = signal({
        visible: false,
        secondsLeft: 30,
        messageIndex: 0,
    });
// Define table columns without action buttons for this milestone
    columnDefs: TableColumn<AgentCertificateRowFlat>[] = [];

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
        this.route.queryParamMap.subscribe(params => {
            this.currentFilter.set(params.get('filter'))
        })

        this.columnDefs = [
            { key: 'actions', label: 'Actions', cellTemplateKey: 'actionsSmallFonts', sortable: false,
                actionButtons: [
                    {
                        id: 'renew',
                        hidden: (row: AgentCertificateRowFlat)=> !row.certIsManaged,
                        customTemplate: this.RenewBtn,
                        onClick: (row)=> {
                            const ctx = this.findMatchingDataFromRow(row);
                            if (ctx) this.requestCertificate(ctx.agent, ctx.service, ctx.domain);
                        }
                    },
                    {
                        id: 'request',
                        hidden: (row: AgentCertificateRowFlat)=> row.certIsManaged,
                        customTemplate: this.RequestBtn,
                        onClick: (row)=> {
                            const ctx = this.findMatchingDataFromRow(row);
                            if (ctx) this.requestCertificate(ctx.agent, ctx.service, ctx.domain);
                        }
                    },
                    {
                        id: 'manage',
                        hidden: (row: AgentCertificateRowFlat) => !row.registryCertificateId,
                        customTemplate: this.ManageBtn,
                        onClick: (row)=>{
                            const ctx = this.findMatchingDataFromRow(row);
                            if (ctx) this.openManageConfigDialog(ctx.agent, ctx.domain);

                        }
                    },
                ]},
            { key: 'hostname', label: 'Host / Agent', sortable: true },
            { key: 'isOnline', label: 'Online', cellTemplateKey: 'check', sortable: true },
            { key: 'serviceName', label: 'Service', sortable: true },
            { key: 'domainName', label: 'Domain / Endpoint', sortable: true },
            { key: 'Issuer', label: 'Issuer', sortable: true },
            { key: 'certExpiry', label: 'Expiration', cellTemplateKey: 'date', sortable: true },
            { key: 'certIsPresent', label: 'Present', cellTemplateKey: 'check', sortable: true },
            { key: 'certIsManaged', label: 'Managed', cellTemplateKey: 'check', sortable: true },
            { key: 'renewalConfigurationName', label: 'Renewal Group', sortable: true },
        ];

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
                this.allTableRows.set(rows);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load flat agent rows', err);
                this.loading.set(false);
            },
        });
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

    tableActionHandler(event: { row: AgentCertificateRowFlat; actionId: string }): void {
        const context = this.findMatchingDataFromRow(event.row);
        if (!context) return;

        switch (event.actionId) {
            case 'request':
                this.requestCertificate(context.agent, context.service, context.domain);
                break;
            case 'manage':
                this.openManageConfigDialog(context.agent, context.domain);
                break;
        }
    }
}
