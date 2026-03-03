import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {LoginService} from './login-service';

export interface ChainLink {
    depth: number;
    common_name: string;
    fingerprint: string;
    expires_at: string; // Go time.Time marshals to an ISO string
}

export interface JobFullChainResponse {
    job_id: string;      // UUIDs are strings in JSON
    target_url: string;
    status: 'pending' | 'completed' | 'failed' | string; // Union type for better type safety
    created_at: string | null; // 'any' in Go usually means nullable string in JSON/TS
    chain: ChainLink[];
}

// Payload for sending a probe request
export interface ProbeRequest {
    target_url: string;
}

// Response from starting a probe
export interface ProbeResponse {
    job_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiscoveryService {
    private http= inject(HttpClient);
    private readonly baseUrl = environment.apiBaseUrl;
    private loginService = inject(LoginService);
    private authHeaders(): HttpHeaders {
        const token = this.loginService.token?.() ?? '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    constructor() { }
    /**
     * Trigger a new discovery probe
     * POST /api/v1/tools/probe
     */
    probeTarget(targetUrl: string): Observable<ProbeResponse> {
        const payload: ProbeRequest = { target_url: targetUrl };
        return this.http.post<ProbeResponse>(`${this.baseUrl}/tools/probe`, payload, { headers: this.authHeaders() });
    }
    getUserJobs(): Observable<JobFullChainResponse[]> {
        return this.http.get<JobFullChainResponse[]>(`${this.baseUrl}/tools/jobs`, { headers: this.authHeaders() });
    }

}
