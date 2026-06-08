import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RenewalConfiguration } from '../../services/renewal-configuration-service';
import {MatButton} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';

@Component({
    selector: 'app-config-form-component',
    standalone: true,
    imports: [CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButton,
    ],
    templateUrl: './config-form-component.html',
    styleUrl: './config-form-component.scss',
})
export class ConfigFormComponent implements OnInit, OnChanges {
    @Input() config: RenewalConfiguration | null = null;
    @Input() isReadonly: boolean = false;
    @Output() configChanged = new EventEmitter<RenewalConfiguration>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            renew_days_before_expiry: [30, Validators.required],
            notify_days_before_renewal: [],
            notify_on_success: [true],
            notify_on_failure: [true],
            notification_emails: [''], // Will handle array parsing
            is_default: [false]
        });
    }

    ngOnInit() {
        if (this.isReadonly) this.form.disable();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['config'] && this.config) {

            let parsedDescription: any = this.config.description;
            if (parsedDescription && typeof parsedDescription==='object' && 'String' in parsedDescription){
                parsedDescription = parsedDescription.String;
            }
            this.form.patchValue({
                ...this.config,
                description: parsedDescription,
                notification_emails: (this.config.notification_emails || []).join(', ')
            });
        }
    }

    onSubmit() {
        if (this.form.valid) {
            const rawValue = this.form.getRawValue();
            this.configChanged.emit({
                ...this.config!,
                ...rawValue,
                notification_emails: rawValue.notification_emails.split(',').map((s: string) => s.trim())
            });
        }
    }
}
