import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcquireCertRequest, AcquireCertResponse } from './certs.model';
import { environment } from '../../environments/environment';
import {LoginService} from './login-service'; // Adjust path as needed

export interface ListProvidersRow {
    id: string;                  // ✅ uuid.UUID serializes to a string in JSON
    name: string;                // ✅
    directory_url: string;       // ✅
    website_url: string | null;  // ✅ sql.NullString serializes to either a string or null
}

@Injectable({
    providedIn: 'root'
})
export class CertsService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}/certs`;
    private readonly loginService = inject(LoginService);

    private authHeaders(): HttpHeaders {
        const token = this.loginService.token?.() ?? '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    /**
     * Requests a CSR generation from a specific agent.
     * Returns an observable that completes once the command is queued.
     */
    acquireCert(payload: AcquireCertRequest): Observable<AcquireCertResponse> {
        return this.http.post<AcquireCertResponse>(
            `${this.apiUrl}/acquire`,
            payload, {headers: this.authHeaders()}
        );
    }

    /**
     * Gets a list of the Providers (CAs) we support.
     */
    getProviderList():Observable<ListProvidersRow[]>{
        return this.http.get<ListProvidersRow[]>(`${this.apiUrl}/providers`);
    }
}
