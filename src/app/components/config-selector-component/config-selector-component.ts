import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { RenewalConfigurationService, RenewalConfiguration } from '../../services/renewal-configuration-service';
import { ConfigFormComponent } from '../config-form-component/config-form-component';

@Component({
    selector: 'app-config-selector',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatRadioModule,
        ConfigFormComponent
    ],
    templateUrl: './config-selector-component.html',
    styleUrls: ['./config-selector-component.scss']
})
export class ConfigSelectorComponent implements OnInit {
    // Accepts a pre-selected ID if one exists
    @Input() currentConfigId: string | null = null;

    // Broadcasts the user's choice back to the parent component
    @Output() configSelected = new EventEmitter<string>();

    configs = signal<RenewalConfiguration[]>([]);
    selectedConfigId: string | null = null;
    selectedConfig = signal<RenewalConfiguration | null>(null);

    private readonly renewalConfigService = inject(RenewalConfigurationService);

    ngOnInit(): void {
        this.loadConfigs();
    }

    loadConfigs(): void {
        this.renewalConfigService.getAllRenewalConfigurations().subscribe({
            next: (data) => {
                this.configs.set(data);

                if (data.length> 0){
                    // check if currentConfigId actually exists in the fetched data
                    const idExists = data.some(c=>c.id === this.currentConfigId);
                    if (this.currentConfigId && !idExists) {
                        //use the provided ID
                        this.selectedConfigId = this.currentConfigId;
                    } else {
                        this.selectedConfigId = data[0].id;
                    }
                    this.onConfigSelect();

                }
            },
            error: (err) => {
                console.error('Failed to load renewal configurations', err);
            }
        });
    }

    onConfigSelect(): void {
        const config = this.configs().find(c => c.id === this.selectedConfigId);
        if (config) {
            this.selectedConfig.set(config);
            this.configSelected.emit(config.id); // Emit the ID to the parent
        }
    }
}
