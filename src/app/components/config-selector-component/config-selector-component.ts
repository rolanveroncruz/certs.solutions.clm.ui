import {Component, EventEmitter, Input, Output, OnInit, inject, signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import {MatTooltipModule} from '@angular/material/tooltip';
import { RenewalConfigurationService, RenewalConfiguration } from '../../services/renewal-configuration-service';
import { ConfigFormComponent } from '../config-form-component/config-form-component';
import {LoginService} from '../../services/login-service';

@Component({
    selector: 'app-config-selector',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatRadioModule,
        MatTooltipModule,
        ConfigFormComponent
    ],
    templateUrl: './config-selector-component.html',
    styleUrls: ['./config-selector-component.scss']
})
export class ConfigSelectorComponent implements OnInit {
    private readonly renewalConfigService = inject(RenewalConfigurationService);
    private readonly loginService = inject(LoginService);

    isOwner = computed(() => {
        const config = this.selectedConfig();
        if (!config || !config.client_id) return false;

        // 1. Extract the raw number if Go sent it as a sql.NullInt64 object
        let dbClientId: any = config.client_id;
        console.log("In isOwner() dbClientId:", dbClientId, "type is:", typeof dbClientId.Int64);
        if (typeof dbClientId === 'object' && 'Int64' in dbClientId) {
            dbClientId = dbClientId.Int64;
        }

        // 2. Force both sides into Strings to defeat the ("1" === 1) strict equality failure
        const safeDbId = String(dbClientId);
        console.log("In isOwner() loginService.clientId:", this.loginService.clientId(), "type is:", typeof(this.loginService.clientId()));
        const safeUserId = String(this.loginService.clientId());

        return safeDbId === safeUserId;
    });


    // Accepts a pre-selected ID if one exists
    @Input() currentConfigId: string | null = null;

    // Broadcasts the user's choice back to the parent component
    @Output() configSelected = new EventEmitter<string>();

    @Output() creatingStateChanged = new EventEmitter<boolean>();

    configs = signal<RenewalConfiguration[]>([]);
    selectedConfigId: string | null = null;
    selectedConfig = signal<RenewalConfiguration | null>(null);

    isCreating = signal(false);

    configToEdit = signal<RenewalConfiguration | null>(null);


    ngOnInit(): void {
        if (this.currentConfigId){
            this.selectedConfigId = this.currentConfigId
        }
        this.loadConfigs();
    }

    loadConfigs(): void {
        this.renewalConfigService.getAllRenewalConfigurations().subscribe({
            next: (data) => {
                this.configs.set(data);

                if (data.length> 0){
                    // check if currentConfigId actually exists in the fetched data
                    const idExists = data.some(c=>c.id === this.currentConfigId);
                    if (this.currentConfigId && idExists) {
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
    startCreate(){
        this.configToEdit.set(null);
        this.isCreating.set(true);
        this.creatingStateChanged.emit(true);

    }
    startClone(){
        if(!this.selectedConfig()) return;
        this.configToEdit.set(this.selectedConfig())
        this.isCreating.set(true);

        this.creatingStateChanged.emit(true);
    }
    cancelCreate(){
        this.isCreating.set(false);
        this.creatingStateChanged.emit(false);
    }
    onConfigSave(newConfig: RenewalConfiguration): void {
        this.renewalConfigService.postRenewalConfiguration(newConfig).subscribe({
            next:(savedConfig:RenewalConfiguration)=>{
                this.configs.update(configs => [...configs, savedConfig]);
                this.selectedConfigId = savedConfig.id;
                this.onConfigSelect();
                this.cancelCreate();
            },
            error :(err)=>{
                console.error('Failed to save new configuration', err);
            }
        })
    }

    deleteConfig(): void {
        const config = this.selectedConfig();
        if (!config) return;

        // ✅ Smart confirmation message using the count we just added!
        const confirmMsg = config.valid_certificate_count && config.valid_certificate_count > 0
            ? `Are you sure you want to delete '${config.name}'?\n\nIts ${config.valid_certificate_count} attached certificates will be reassigned to your default policy.`
            : `Are you sure you want to delete '${config.name}'?`;

        if (confirm(confirmMsg)) {
            // Ensure this method matches the one we fixed in your RenewalConfigurationService
            this.renewalConfigService.deleteRenewalConfiguration(config.id).subscribe({
                next: () => {
                    // Remove the deleted config from the local array
                    this.configs.update(configs => configs.filter(c => c.id !== config.id));

                    // Reset selection to the first available config, or null if empty
                    if (this.configs().length > 0) {
                        this.selectedConfigId = this.configs()[0].id;
                    } else {
                        this.selectedConfigId = null;
                    }
                    this.onConfigSelect();
                },
                error: (err) => {
                    console.error('Failed to delete configuration', err);
                    // Displays the 403 Forbidden or 409 Conflict messages from your Go backend
                    alert(err.error || 'Failed to delete configuration.');
                }
            });
        }
    }
    onConfigEdit(updatedConfig: RenewalConfiguration): void {
        this.renewalConfigService.putRenewalConfiguration(updatedConfig.id, updatedConfig).subscribe({
            next: (savedConfig: RenewalConfiguration) => {
                // Update the specific configuration in the local array
                this.configs.update(configs => configs.map(c => c.id === savedConfig.id ? savedConfig : c));
                this.selectedConfig.set(savedConfig); // Refresh the view
                alert('Configuration updated successfully!');
            },
            error: (err) => {
                console.error('Failed to update configuration', err);
                alert(err.error || 'Failed to update configuration.');
            }
        });
    }

}
