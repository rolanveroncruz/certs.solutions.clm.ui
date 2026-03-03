import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import {AgentInfoRes} from './agents.model';
import { environment } from '../../environments/environment';
import {LoginService} from './login-service';

@Injectable({
    providedIn: 'root'
})
export class AgentsService {
    // Assuming your API base path is defined in environment
    private readonly apiUrl = `${environment.apiBaseUrl}/agents`;
    private readonly loginService =inject(LoginService);

    constructor(private http: HttpClient) {}

    private authHeaders(): HttpHeaders {
        const token = this.loginService.token?.() ?? '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    /**
     * Fetches the list of all agents, including hardware info
     * and discovered services (mapped from HandleListAgents).
     */
    listAgents(): Observable<AgentInfoRes[]> {
        return this.http.get<AgentInfoRes[]>(this.apiUrl, {headers: this.authHeaders()});
    }

    /**
     * Helper to determine if a certificate is nearing expiration
     * (Useful for UI highlighting)
     */
    isExpiringSoon(expiresAt: string, daysThreshold: number = 30): boolean {
        if (!expiresAt) return false;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        return days > 0 && days <= daysThreshold;
    }
}
