import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcquireCertRequest, AcquireCertResponse } from './certs.model';
import { environment } from '../../environments/environment';
import {LoginService} from './login-service'; // Adjust path as needed

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
}
