import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {AgentResponse} from '../../../services/agents.model';
import {parseApiDate, timeAgo} from '../../../utils/time-ago';

export interface DiscoveryPickerDialogData {
    agents: AgentResponse[];
}

// The dialog closes with the ids of the agents to run discovery on, or undefined when cancelled.
export type DiscoveryPickerDialogResult = string[] | undefined;

@Component({
    selector: 'app-discovery-picker-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatCheckboxModule,
        MatButtonModule,
    ],
    templateUrl: './discovery-picker-dialog-component.html',
    styleUrls: ['./discovery-picker-dialog-component.scss'],
})
export class DiscoveryPickerDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<DiscoveryPickerDialogComponent, DiscoveryPickerDialogResult>);
    private readonly data = inject<DiscoveryPickerDialogData>(MAT_DIALOG_DATA);

    // Online agents first, then alphabetical
    readonly agents = [...this.data.agents].sort((a, b) =>
        Number(b.is_online) - Number(a.is_online) || a.hostname.localeCompare(b.hostname)
    );
    private readonly onlineIds = this.agents.filter(a => a.is_online).map(a => a.id);

    // Online agents are selected by default; offline agents can't receive the trigger
    selected = signal<Set<string>>(new Set(this.onlineIds));

    selectedCount = computed(() => this.selected().size);
    allOnlineSelected = computed(() => this.onlineIds.length > 0 && this.selected().size === this.onlineIds.length);
    someOnlineSelected = computed(() => this.selected().size > 0 && !this.allOnlineSelected());
    hasOnlineAgents = this.onlineIds.length > 0;

    isSelected(agent: AgentResponse): boolean {
        return this.selected().has(agent.id);
    }

    toggle(agent: AgentResponse, checked: boolean): void {
        if (!agent.is_online) return;
        const next = new Set(this.selected());
        if (checked) {
            next.add(agent.id);
        } else {
            next.delete(agent.id);
        }
        this.selected.set(next);
    }

    toggleAllOnline(checked: boolean): void {
        this.selected.set(checked ? new Set(this.onlineIds) : new Set());
    }

    lastDiscoveryText(agent: AgentResponse): string {
        const date = parseApiDate(agent.last_successful_discovery_at);
        return `Last successful discovery: ${date ? timeAgo(date) : 'Never'}`;
    }

    onConfirm(): void {
        this.dialogRef.close([...this.selected()]);
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
