import {ActivatedRoute, RouterLink} from '@angular/router';
import {Component, computed, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild} from '@angular/core';
import {catchError, forkJoin, map, of} from 'rxjs';
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
import {CommonModule, formatDate, NgOptimizedImage} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {
    DiscoveryPickerDialogComponent,
    DiscoveryPickerDialogData,
    DiscoveryPickerDialogResult
} from './discovery-picker-dialog-component/discovery-picker-dialog-component';
import {parseApiDate, timeAgo} from '../../utils/time-ago';

// How long the banner counts down before each refresh while waiting for discovery to finish
const DISCOVERY_REFRESH_SECONDS = 15;
// Stop waiting for discovery to finish after this long
const DISCOVERY_MAX_WAIT_MS = 5 * 60 * 1000;


@Component({
    selector: 'app-agents',
    templateUrl: './agents-component.html',
    imports: [
        CommonModule,
        GenericDataTableComponent,
        NgOptimizedImage,
        MatCardModule,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule,
        MatSnackBarModule,
        RouterLink,
    ],
    styleUrls: ['./agents-component.scss'],
    standalone: true
})
export class AgentsComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly loginService = inject(LoginService);
    private readonly certsService = inject(CertsService);
    private readonly renewalConfigService = inject(RenewalConfigurationService);
    private readonly dialog=inject(MatDialog);
    private readonly agentsService = inject(AgentsService);
    private readonly snackBar = inject(MatSnackBar);

    @ViewChild('RenewBtn', { static: true }) RenewBtn!: TemplateRef<any>;
    @ViewChild('RequestBtn', { static: true }) RequestBtn!: TemplateRef<any>;
    @ViewChild('ManageBtn', { static: true }) ManageBtn!: TemplateRef<any>;
    @ViewChild('OnlineCell', { static: true }) OnlineCell!: TemplateRef<any>;
    @ViewChild('HostCell', { static: true }) HostCell!: TemplateRef<any>;
    @ViewChild('ServiceCell', { static: true }) ServiceCell!: TemplateRef<any>;
    @ViewChild('DomainCell', { static: true }) DomainCell!: TemplateRef<any>;
    @ViewChild('IssuerCell', { static: true }) IssuerCell!: TemplateRef<any>;

    loading = signal(false);
    agents = signal<AgentResponse[]>([]);
    agentCount = signal(0);
    domainCount = signal(0);
    maxAgents = signal<number | null>(null);
    maxDomains = signal<number | null>(null);
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

    // State of a discovery we are waiting on. The banner counts down, refreshes, and repeats until all agents finish.
    private discoveryTimerId: ReturnType<typeof setInterval> | null = null;
    private discoveryWatch: { baseline: Map<string, string>; pending: Set<string>; total: number; startedAt: number } | null = null;
    discoveryProgress = signal({
        visible: false,
        secondsLeft: 0,
        refreshing: false,
        pendingCount: 0,
        totalCount: 0,
    });

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
            { key: 'hostname', label: 'Host / Agent', sortable: true, customCellTemplate: this.HostCell },
            { key: 'isOnline', label: 'Online', sortable: true, customCellTemplate: this.OnlineCell },
            { key: 'serviceName', label: 'Service', sortable: true, customCellTemplate: this.ServiceCell },
            { key: 'providerName', label: 'CA', sortable: true },
            { key: 'domainName', label: 'Domain / Endpoint', sortable: true, customCellTemplate: this.DomainCell },
            { key: 'Issuer', label: 'Issuer', sortable: true, customCellTemplate: this.IssuerCell },
            { key: 'certExpiry', label: 'Expiration', cellTemplateKey: 'date', sortable: true },
            { key: 'certIsPresent', label: 'Present', cellTemplateKey: 'check', sortable: true },
            { key: 'certIsManaged', label: 'Managed', cellTemplateKey: 'check', sortable: true },
            { key: 'renewalConfigurationName', label: 'Renewal Group', sortable: true },
        ];

        this.loadAgents();
    }

    ngOnDestroy(): void {
        this.stopDiscoveryWatch();
        if (this.progressTimerId) {
            clearInterval(this.progressTimerId);
            this.progressTimerId = null;
        }
    }

    // When `silent` is true the table stays visible instead of switching to the loader.
    // `onLoaded` receives the agents, or null when the request failed.
    loadAgents(silent = false, onLoaded?: (agents: AgentResponse[] | null) => void): void {
        const clientId = this.loginService.clientId();

        if (!silent) {
            this.loading.set(true);
        }

        // Fetch raw objects for card view
        this.agentsService.listAgents(clientId).subscribe({
            next: (data) => {
                this.agents.set(data.agents ?? []);
                this.agentCount.set(data.agent_count ?? 0);
                this.domainCount.set(data.domain_count ?? 0);
                this.maxAgents.set(data.max_agents ?? null);
                this.maxDomains.set(data.max_domains ?? null);
                this.loading.set(false);
                onLoaded?.(data.agents ?? []);
            },
            error: (err) => {
                console.error('Failed to load agents', err);
                this.loading.set(false);
                onLoaded?.(null);
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
                registryCertId: domain.certificate?.registry_certificate_id ?? undefined,
                currentProviderId: (domain.certificate as any)?.provider_id?? undefined,
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

    // Builds the tooltip text showing the agent's last successful discovery and its mTLS certificate expiration
    lastDiscoveryTooltip(row: AgentCertificateRowFlat): string {
        const date = parseApiDate(row.lastSuccessfulDiscoveryAt);
        const lines = [`Last successful discovery: ${date ? timeAgo(date) : 'Never'}`];

        const expiresAt = parseApiDate(row.mtlsCertExpiresAt);
        lines.push(`mTLS cert expires: ${expiresAt ? formatDate(expiresAt, 'MMM d, y, h:mm a', 'en-US') : 'Unknown'}`);

        const days = row.mtlsCertDaysRemaining;
        if (expiresAt && days !== null && days !== undefined) {
            lines.push(days < 0
                ? `mTLS cert expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
                : `mTLS cert days remaining: ${days}`);
        }
        return lines.join('\n');
    }

    // Opens the picker, then asks each selected agent to run discovery
    openDiscoveryPicker(): void {
        const dialogRef = this.dialog.open<
            DiscoveryPickerDialogComponent,
            DiscoveryPickerDialogData,
            DiscoveryPickerDialogResult
        >(DiscoveryPickerDialogComponent, {
            width: '520px',
            maxWidth: '95vw',
            data: { agents: this.agents() },
        });

        dialogRef.afterClosed().subscribe(agentIds => {
            if (agentIds && agentIds.length > 0) {
                this.runDiscovery(agentIds);
            }
        });
    }

    private runDiscovery(agentIds: string[]): void {
        const agents = this.agents();
        // Remember each agent's last completion time so we can tell when a new discovery has finished
        const baseline = new Map<string, string>(
            agentIds.map(id => [id, agents.find(a => a.id === id)?.last_discovery_completed_at ?? ''])
        );

        forkJoin(agentIds.map(id =>
            this.agentsService.triggerDiscovery(id).pipe(
                map(() => ({ id, error: null as string | null })),
                catchError((err: Error) => of({ id, error: err.message || 'Failed to request discovery' }))
            )
        )).subscribe(results => {
            const succeeded = results.filter(r => !r.error);
            const failed = results.filter(r => r.error);
            const hostname = (id: string) => agents.find(a => a.id === id)?.hostname ?? id;
            const plural = (n: number) => `${n} agent${n === 1 ? '' : 's'}`;

            if (succeeded.length === 0) {
                const details = failed.map(r => `${hostname(r.id)}: ${r.error}`).join('; ');
                this.snackBar.open(`Discovery could not be requested (${details})`, 'Dismiss', { duration: 8000 });
                return;
            }

            if (failed.length === 0) {
                this.snackBar.open(`Discovery requested for ${plural(succeeded.length)}.`, 'OK', { duration: 5000 });
            } else {
                const details = failed.map(r => `${hostname(r.id)}: ${r.error}`).join('; ');
                this.snackBar.open(
                    `Discovery requested for ${succeeded.length} of ${agentIds.length} agents (${details})`,
                    'Dismiss',
                    { duration: 8000 }
                );
            }

            this.startDiscoveryWatch(succeeded.map(r => r.id), baseline);
        });
    }

    private startDiscoveryWatch(agentIds: string[], baseline: Map<string, string>): void {
        this.stopDiscoveryWatch();
        this.discoveryWatch = {
            baseline,
            pending: new Set(agentIds),
            total: agentIds.length,
            startedAt: Date.now(),
        };
        this.startDiscoveryCountdown();
    }

    private startDiscoveryCountdown(): void {
        const watch = this.discoveryWatch;
        if (!watch) return;

        this.clearDiscoveryTimer();
        this.discoveryProgress.set({
            visible: true,
            secondsLeft: DISCOVERY_REFRESH_SECONDS,
            refreshing: false,
            pendingCount: watch.pending.size,
            totalCount: watch.total,
        });

        this.discoveryTimerId = setInterval(() => {
            const secondsLeft = this.discoveryProgress().secondsLeft - 1;
            if (secondsLeft <= 0) {
                this.refreshDiscovery();
            } else {
                this.discoveryProgress.update(p => ({ ...p, secondsLeft }));
            }
        }, 1000);
    }

    // Reloads the agents now (also used by the banner's "Refresh now" link) and repeats the countdown until done
    refreshDiscovery(): void {
        const watch = this.discoveryWatch;
        if (!watch || this.discoveryProgress().refreshing) return;

        this.clearDiscoveryTimer();
        this.discoveryProgress.update(p => ({ ...p, secondsLeft: 0, refreshing: true }));

        this.loadAgents(true, agents => {
            // The watch may have been stopped while the request was in flight
            if (this.discoveryWatch !== watch) return;

            if (agents) {
                for (const id of [...watch.pending]) {
                    const agent = agents.find(a => a.id === id);
                    const completedAt = agent?.last_discovery_completed_at ?? '';
                    // Agent removed, or it reported a new completion time since we triggered it
                    if (!agent || (parseApiDate(completedAt) && completedAt !== watch.baseline.get(id))) {
                        watch.pending.delete(id);
                    }
                }
            }

            if (watch.pending.size === 0) {
                this.stopDiscoveryWatch();
                this.snackBar.open(
                    `Discovery finished for ${watch.total} agent${watch.total === 1 ? '' : 's'}.`,
                    'OK',
                    { duration: 5000 }
                );
            } else if (Date.now() - watch.startedAt > DISCOVERY_MAX_WAIT_MS) {
                this.stopDiscoveryWatch();
                this.snackBar.open(
                    `Discovery is taking longer than expected for ${watch.pending.size} agent${watch.pending.size === 1 ? '' : 's'}. Refresh the page later to see the results.`,
                    'Dismiss',
                    { duration: 10000 }
                );
            } else {
                this.startDiscoveryCountdown();
            }
        });
    }

    private clearDiscoveryTimer(): void {
        if (this.discoveryTimerId) {
            clearInterval(this.discoveryTimerId);
            this.discoveryTimerId = null;
        }
    }

    private stopDiscoveryWatch(): void {
        this.clearDiscoveryTimer();
        this.discoveryWatch = null;
        this.discoveryProgress.set({
            visible: false,
            secondsLeft: 0,
            refreshing: false,
            pendingCount: 0,
            totalCount: 0,
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

    deleteAgent(row: AgentCertificateRowFlat): void {
        if (row.isOnline || !row.agentId) return;
        const name = row.hostname || row.agentId;
        if (!confirm(`Are you sure you want to delete agent "${name}"?`)) {
            return;
        }
        this.agentsService.deleteAgent(row.agentId).subscribe({
            next: () => {
                this.snackBar.open(`Agent ${name} deleted.`, 'OK', { duration: 5000 });
                this.loadAgents();
            },
            error: (err: Error) => {
                this.snackBar.open(err.message || 'Failed to delete agent.', 'Dismiss', { duration: 8000 });
            }
        });
    }

    deleteStaleService(row: AgentCertificateRowFlat): void {
        const serviceId = row.serviceId;
        if (!serviceId) return;

        const confirmMsg = 'Deleting a stale service will also delete stale domains and certificate deployments. Are you sure you want to delete this stale service?';
        if (!confirm(confirmMsg)) {
            return;
        }

        this.agentsService.deleteStaleService(serviceId).subscribe({
            next: () => {
                this.loadAgents();
            },
            error: (err) => {
                console.error('Failed to delete stale service', err);
                alert(err.message || 'Failed to delete stale service');
                this.loadAgents();
            }
        });
    }

    deleteStaleDomain(row: AgentCertificateRowFlat): void {
        const domainId = row.domainId || row.domainName;
        if (!domainId) return;

        const confirmMsg = 'Deleting a stale domain will delete the associated certificate deployment. Are you sure you want to delete this stale domain?';
        if (!confirm(confirmMsg)) {
            return;
        }

        this.agentsService.deleteStaleDomain(domainId).subscribe({
            next: () => {
                this.loadAgents();
            },
            error: (err) => {
                console.error('Failed to delete stale domain', err);
                alert(err.message || 'Failed to delete stale domain');
                this.loadAgents();
            }
        });
    }

    deleteStaleCertDeployment(row: AgentCertificateRowFlat): void {
        const deploymentId = row.deploymentId || row.registryCertificateId || row.certPath;
        if (!deploymentId) return;

        const confirmMsg = 'Are you sure you want to delete this stale certificate deployment?';
        if (!confirm(confirmMsg)) {
            return;
        }

        this.agentsService.deleteStaleCertDeployment(deploymentId).subscribe({
            next: () => {
                this.loadAgents();
            },
            error: (err) => {
                console.error('Failed to delete stale certificate deployment', err);
                alert(err.message || 'Failed to delete stale certificate deployment');
                this.loadAgents();
            }
        });
    }
}
