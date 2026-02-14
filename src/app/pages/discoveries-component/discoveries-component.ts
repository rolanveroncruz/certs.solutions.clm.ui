import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import {DiscoveryService, JobFullChainResponse, ChainLink} from '../../services/discovery-service';

@Component({
    selector: 'app-discoveries',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatChipsModule,
        MatTooltipModule
    ],
    templateUrl: './discoveries-component.html',
    styleUrls: ['./discoveries-component.scss']
})
export class DiscoveriesComponent implements OnInit {
    private discoveryService = inject(DiscoveryService);

    // Signals for Reactive State
    targetUrl = signal('');
    isLoading = signal(false);
    jobs = signal<JobFullChainResponse[]>([]);
    selectedJob = signal<JobFullChainResponse | null>(null);

    // Computed signal to organize the chain (Root -> Leaf) for display if needed
    // The API returns Depth 0 (Leaf) first.
    selectedJobChain = computed(() => {
        const job = this.selectedJob();
        if (!job || !job.chain) return [];
        // Return as-is (Leaf -> Root) for "Issued By" visualization
        return job.chain;
    });

    ngOnInit() {
        this.loadJobs();
    }

    loadJobs() {
        this.isLoading.set(true);
        this.discoveryService.getUserJobs().subscribe({
            next: (data) => {
                console.log('Loaded jobs:', data);
                this.jobs.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading jobs:', err);
                this.isLoading.set(false);
            }
        });
    }

    probeTarget() {
        const target = this.targetUrl().trim();
        if (!target) return;

        this.isLoading.set(true);

        this.discoveryService.probeTarget(target).subscribe({
            next: () => {
                this.targetUrl.set(''); // Clear input
                // Small delay to allow the background worker to finish (simple polling simulation)
                setTimeout(() => this.loadJobs(), 1500);
            },
            error: (err) => {
                console.error('Probe failed:', err);
                this.isLoading.set(false);
            }
        });
    }

    selectJob(job: JobFullChainResponse) {
        this.selectedJob.set(job);
    }

    // Helper for status colors
    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'completed': return 'accent';
            case 'failed': return 'warn';
            default: return 'primary'; // Pending
        }
    }
}
