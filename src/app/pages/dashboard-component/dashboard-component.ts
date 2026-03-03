import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

type StatCard = {
  label: string;
  value: string;
  icon: string;
  hint?: string;
};

type RecentActivity = {
  when: string;
  title: string;
  detail: string;
  icon: string;
};

type ExpiringCert = {
  commonName: string;
  environment: 'Prod' | 'Staging' | 'Dev';
  daysLeft: number;
  issuer: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.scss'],
})
export class DashboardComponent {
  // In real life, these come from your API
  readonly stats = signal<StatCard[]>([
    { label: 'Active Certificates', value: '128', icon: 'verified', hint: 'Currently valid + deployed' },
    { label: 'Expiring (30 days)', value: '7', icon: 'schedule', hint: 'Needs attention soon' },
    { label: 'Pending Requests', value: '4', icon: 'hourglass_top', hint: 'Awaiting approval or issuance' },
    { label: 'Agents Online', value: '12', icon: 'smart_toy', hint: 'Last 5 minutes heartbeat' },
  ]);

  readonly expiring = signal<ExpiringCert[]>([
    { commonName: 'api.company.com', environment: 'Prod', daysLeft: 12, issuer: 'Let’s Encrypt' },
    { commonName: 'vpn.company.com', environment: 'Prod', daysLeft: 19, issuer: 'DigiCert' },
    { commonName: 'staging.company.com', environment: 'Staging', daysLeft: 25, issuer: 'Let’s Encrypt' },
    { commonName: 'internal-ca-01', environment: 'Dev', daysLeft: 29, issuer: 'Internal CA' },
  ]);

  readonly activity = signal<RecentActivity[]>([
    { when: '2m ago', title: 'Certificate renewed', detail: 'api.company.com (Prod)', icon: 'autorenew' },
    { when: '18m ago', title: 'Agent check-in', detail: 'agent-ph-03 is online', icon: 'cloud_done' },
    { when: '1h ago', title: 'CSR created', detail: 'vpn.company.com', icon: 'description' },
    { when: '3h ago', title: 'Policy updated', detail: 'Renewal window set to 21 days', icon: 'policy' },
  ]);

  // A simple “health” style metric for the header progress (example)
  readonly compliancePct = signal(86);

  readonly complianceLabel = computed(() => {
    const v = this.compliancePct();
    if (v >= 90) return 'Excellent';
    if (v >= 75) return 'Good';
    if (v >= 60) return 'Fair';
    return 'Needs attention';
  });

  // Actions (wire these to navigation/dialogs later)
  onRequestCertificate(): void {
    // TODO: navigate to Discoveries or Request flow
    console.log('Request new certificate');
  }

  onRunDiscovery(): void {
    // TODO: navigate to Discoveries page
    console.log('Run discovery');
  }

  onViewAllExpiring(): void {
    // TODO: navigate to Certificates list filtered by expiry
    console.log('View all expiring');
  }

  onOpenCert(item: ExpiringCert): void {
    // TODO: open certificate detail
    console.log('Open cert', item);
  }
}
