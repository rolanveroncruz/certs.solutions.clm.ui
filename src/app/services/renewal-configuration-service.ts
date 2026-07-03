import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {LoginService} from './login-service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface RenewalConfiguration {
    id: string;
    client_id: number | null; // sql.NullInt64 can be null
    name: string;
    description: string | null;
    renew_days_before_expiry: number;

    // CORRECTION: This is an int32 array in Go, so it must be an array in TS
    notify_days_before_renewal: number[];

    notify_on_success: boolean;
    notify_on_failure: boolean;
    notification_emails: string[];

    // CORRECTION: pqtype.NullRawMessage becomes an object in JSON
    notification_channels: { [key: string]: boolean } | null;

    is_default: boolean;
    created_at: string | null;
    updated_at: string | null;
    valid_certificate_count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RenewalConfigurationService {
    private readonly renewalConfigApiUrl = `${environment.apiBaseUrl}/renewal-configs`;
    private readonly certsApiUrl = `${environment.apiBaseUrl}/certs`;
    private readonly loginService =inject(LoginService);
    private readonly clientId = this.loginService.clientId();
    private readonly httpClient = inject(HttpClient);


    private authHeaders(): HttpHeaders {
        const token = this.loginService.token?.() ?? '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    /**
     * Fetches the list of all renewal_configurations.
     */
    getAllRenewalConfigurations(): Observable<RenewalConfiguration[]> {
        return this.httpClient.get<RenewalConfiguration[]>(`${this.renewalConfigApiUrl}`, {headers: this.authHeaders()});
    }

    postRenewalConfiguration(payload: Partial<RenewalConfiguration>): Observable<RenewalConfiguration> {
        return this.httpClient.post<RenewalConfiguration>(
            this.renewalConfigApiUrl, payload, { headers: this.authHeaders() }
        );
    }
    deleteRenewalConfiguration(config_id: string): Observable<void>{
        return this.httpClient.delete<void>(`${this.renewalConfigApiUrl}/${config_id}`,
            {headers: this.authHeaders()})
    }

    patchCertificate(registry_id: string, config_id: string): Observable<void> {
        return this.httpClient.patch<void>(
            `${this.certsApiUrl}/${registry_id}/config`,
            { config_id },
            { headers: this.authHeaders() }
        );
    }

    putRenewalConfiguration(config_id: string, payload: Partial<RenewalConfiguration>): Observable<RenewalConfiguration> {
        return this.httpClient.put<RenewalConfiguration>(
            `${this.renewalConfigApiUrl}/${config_id}`,
            payload,
            { headers: this.authHeaders() }
        );
    }

}
