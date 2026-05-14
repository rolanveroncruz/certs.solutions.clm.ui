import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AgentsService } from '../../services/agents-service';
import {
    AgentResponse,
    ServiceData,
    DomainData,
} from '../../services/agents.model';

import { CertsService } from '../../services/certs-service';
import { CertRequestModalComponent } from './cert-request-modal-component/cert-request-modal-component';
import { AcquireCertRequest } from '../../services/certs.model';
import { LoginService } from '../../services/login-service';

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
})
export class AgentsComponent implements OnInit {
    private readonly loginService = inject(LoginService);
    private readonly certsService = inject(CertsService);

    expandedAgentId: string | null = null;

    loading = signal(false);
    agents = signal<AgentResponse[]>([]);

    activeRequest: ActiveCertRequest | null = null;

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
                alert('Successfully requested certificate');
                this.activeRequest = null;
                this.loadAgents();
            },
            error: (err) => {
                console.error('Failed to acquire certificate', err);
                alert('Failed to acquire certificate');
            },
        });
    }
}
