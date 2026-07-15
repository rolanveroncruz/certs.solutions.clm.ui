import {Component, signal, inject, computed} from '@angular/core';
import {Router} from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
// ✅ Removed MatProgressBarModule
import { MatChipsModule } from '@angular/material/chips';
import {AgentsService} from '../../services/agents-service';
import {AgentResponse} from '../../services/agents.model';

type StatCard = {
  label: string;
  value: string;
  icon: string;
  hint?: string;
  route?: string;
};

// ... (Type definitions remain the same)

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        // ✅ Removed MatProgressBarModule
        MatChipsModule,
        // ✅ Removed MatDividerModule
    ],
    templateUrl: './dashboard-component.html',
    styleUrls: ['./dashboard-component.scss'],
})
export class DashboardComponent {
    private readonly router = inject(Router);
    private readonly agentsService = inject(AgentsService);
    readonly agents = signal<AgentResponse[]>([]);
    readonly allCertificates = computed(()=>this.agentsService.getAllCertificates(this.agents()))

    // Actions (wire these to navigation/dialogs later)
    onRequestCertificate(): void {
        // TODO: navigate to Discoveries or Request flow
        console.log('Request new certificate');
    }
    onStatClick(route?:string): void{
        if (route){
            this.router.navigateByUrl(route).then(r => {
                console.log("routed to:", r);
            });
        }
    }
    // ✅ 1. Num Active Certificates (Managed)
    readonly numActiveCertificates = computed(() =>
        this.allCertificates().filter(c => c.is_managed).length
    );

// ✅ 2. Num Expiring Certificates (<= 30 days or expired)
    readonly numExpiringCertificates = computed(() =>
        this.allCertificates().filter(c =>
            c.expiry && this.agentsService.isExpiringSoon(c.expiry, 30)
        ).length
    );

// ✅ 3. Num Online Agents
    readonly numOnlineAgents = computed(() =>
        this.agents().filter(a => a.is_online).length
    );
// Lifecycle to load data
    ngOnInit() {
        this.agentsService.listAgents(1).subscribe(data => {
            this.agents.set(data);
        });
    }

}
