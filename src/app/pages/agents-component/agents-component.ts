import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {RouterLink} from '@angular/router';
import { AgentsService } from '../../services/agents-service';
import {
    AgentResponse,
    ServiceData,
    DomainData, CertDeployment,
} from '../../services/agents.model';

import { CertsService } from '../../services/certs-service';
import { CertRequestModalComponent } from './cert-request-modal-component/cert-request-modal-component';
import { AcquireCertRequest } from '../../services/certs.model';
import { LoginService } from '../../services/login-service';
import {MatDialog} from '@angular/material/dialog';

type ActiveCertRequest = {
    agentId: string;
    agent: AgentResponse;
    service: ServiceData;
    domain: DomainData;
};

@Component({
    selector: 'app-agents',
    templateUrl: './agents-component.html',
    imports: [
        DatePipe,
        CertRequestModalComponent,
    ],
    styleUrls: ['./agents-component.scss'],
    standalone: true
})
export class AgentsComponent implements OnInit {
    private readonly loginService = inject(LoginService);
    private readonly certsService = inject(CertsService);
    private readonly dialog=inject(MatDialog);

    expandedAgentId: string | null = null;

    loading = signal(false);
    agents = signal<AgentResponse[]>([]);

    activeRequest: ActiveCertRequest | null = null;
    private progressTimerId: ReturnType<typeof setInterval> |null = null;
    requestProgress = signal({
        visible: false,
        secondsLeft: 30,
        messageIndex: 0,
    });
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

    constructor(private agentsService: AgentsService) {}

    ngOnInit(): void {
        this.loadAgents();
    }

    loadAgents(): void {
        const clientId = this.loginService.clientId();

        this.loading.set(true);

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
    }

    toggleAgent(id: string): void {
        this.expandedAgentId = this.expandedAgentId === id ? null : id;
    }

    requestCertificate(
        agent: AgentResponse,
        service: ServiceData,
        domain: DomainData,
    ): void {
        this.activeRequest = {
            agentId: agent.id,
            agent,
            service,
            domain,
        };
    }

    handleModalConfirm(payload: AcquireCertRequest): void {
        this.certsService.acquireCert(payload).subscribe({
            next: () => {
                this.activeRequest = null;
                this.startRequestProgressBanner();
            },
            error: (err) => {
                console.error('Failed to acquire certificate', err);
                alert('Failed to acquire certificate');
            },
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
    openManageConfigDialog(cert: CertDeployment): void {
/*
        const dialogRef = this.dialog.open(ManageConfigDialogComponent, {
            width: '950px',
            maxWidth: '95vw',
            maxHeight: '95vh',
            data: {
                registryCertId: cert.registry_certificate_id,
                currentConfigId: cert.renewal_configuration_id
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'saved') {
                this.loadAgents(); // Refresh the list to show the updated name
            }
        });
*/
    }
}
