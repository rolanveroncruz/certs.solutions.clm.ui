import {Component, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {AgentsService} from '../../services/agents-service';
import {AgentInfoRes, AgentDiscoveryRes} from '../../services/agents.model';
import {CertsService} from '../../services/certs-service';
import {CertRequestModalComponent} from './cert-request-modal-component/cert-request-modal-component';
import {AcquireCertRequest} from '../../services/certs.model';

@Component({
    selector: 'app-agents',
    templateUrl: './agents-component.html',
    imports: [
        DecimalPipe,
        CertRequestModalComponent
    ],
    styleUrls: ['./agents-component.scss']
})
export class AgentsComponent implements OnInit {
    certsService = inject(CertsService);
    expandedAgentId: string | null = null;
    loading = signal(false);
    agents = signal<AgentInfoRes[]>([]);
    activeRequest:{agentId:string, discovery:AgentDiscoveryRes} |null = null;

    constructor(private agentsService: AgentsService) {}

    ngOnInit(): void {
        this.loadAgents();
    }

    loadAgents(): void {
        this.loading.set(true);
        this.agentsService.listAgents().subscribe({
            next: (data) => {
                this.agents.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load agents', err);
                this.loading.set(false);
            }
        });
    }

    toggleAgent(id: string): void {
        this.expandedAgentId = this.expandedAgentId === id ? null : id;
    }

    // Updated to accept your specific Discovery result or a domain string
    requestCertificate(agentId: string, target: AgentDiscoveryRes ): void {
        this.activeRequest = {agentId:agentId, discovery:target};
    }

    handleModalConfirm(payload: AcquireCertRequest ): void{
        this.certsService.acquireCert(payload).subscribe({
            next: (data) => {
                alert(`Successfully requested ${payload} certificate`);
                this.activeRequest = null;
            },
            error: (err) => {
                alert(`Failed to acquire certificate: ${err}`);
            }
        })
    }
}
