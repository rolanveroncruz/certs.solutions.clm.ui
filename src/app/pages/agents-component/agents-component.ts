import {Component, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {AgentsService} from '../../services/agents-service';
import {AgentInfoRes, AgentDiscoveryRes} from '../../services/agents.model';

@Component({
    selector: 'app-agents',
    templateUrl: './agents-component.html',
    imports: [
        DecimalPipe
    ],
    styleUrls: ['./agents-component.scss']
})
export class AgentsComponent implements OnInit {
    expandedAgentId: string | null = null;
    loading = signal(false);
    agents = signal<AgentInfoRes[]>([]);

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
    requestCertificate(target: AgentDiscoveryRes | string): void {
        const identifier = typeof target === 'string' ? target : target.serviceName;
        alert(`Requesting certificate for: ${identifier}`);
    }
}
