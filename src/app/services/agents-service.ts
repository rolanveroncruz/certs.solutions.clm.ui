import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {LoginService} from './login-service';
import {AgentCertificateRowFlat, AgentResponse, DomainData, ServiceData} from './agents.model';

export interface GenerateEnrollmentTokenRequest{
    client_id: number;
    hostname: string;
    group: string;
    ttl_minutes:number;
}
export interface GenerateEnrollmentTokenResponse{
    token: string;
    expires_at: string;
    bootstrap_url: string;
}
@Injectable({
    providedIn: 'root'
})
export class AgentsService {
    // Assuming your API base path is defined in environment
    private readonly apiUrl = `${environment.apiBaseUrl}/agents`;
    private readonly loginService =inject(LoginService);

    constructor(private http: HttpClient) {

    }

    private authHeaders(): HttpHeaders {
        const token = this.loginService.token?.() ?? '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    /**
     * Fetches the list of all agents, including hardware info
     * and discovered services (mapped from HandleListAgents).
     */
    listAgents(client_id:number): Observable<AgentResponse[]> {
        return this.http.get<AgentResponse[]>
        (
            `${this.apiUrl}`,
            {
                params: {client_id: client_id},
                headers: this.authHeaders(),
            },
        );
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
    generateEnrollmentToken(payload: GenerateEnrollmentTokenRequest): Observable<GenerateEnrollmentTokenResponse> {
        return this.http.post<GenerateEnrollmentTokenResponse>(`${environment.apiBaseUrl}/enroll/generate`, payload, {headers: this.authHeaders()});
    }
    listAgentsAsRows(client_id: number): Observable<AgentCertificateRowFlat[]> {
        return this.listAgents(client_id).pipe(
            map((agents: AgentResponse[]) => {
                const rows: AgentCertificateRowFlat[] = [];

                for (const agent of agents) {
                    // 🟩 If the agent has absolutely no services discovered yet, add a placeholder row
                    if (!agent.services || agent.services.length === 0) { // 🟩
                        rows.push(this.createEmptyRowPlaceholder(agent, null, null)); // 🟩
                        continue; // 🟩
                    } // 🟩

                    for (const service of agent.services) {
                        // 🟩 If a service has no domains matched to it, add a placeholder row
                        if (!service.domains || service.domains.length === 0) { // 🟩
                            rows.push(this.createEmptyRowPlaceholder(agent, service, null)); // 🟩
                            continue; // 🟩
                        } // 🟩

                        for (const domain of service.domains) {
                            rows.push({
                                agentId: agent.id,
                                agentIdentity: agent.agent_identity,
                                hostname: agent.hostname,
                                isOnline: agent.is_online,

                                serviceId: service.service_id,
                                serviceName: service.name,

                                domainName: domain.domain_name,
                                domainLastSeen: domain.last_seen,

                                certPath: domain.certificate?.cert_path ?? null,
                                Issuer: domain.certificate?.issuer ?? null,
                                certExpiry: domain.certificate?.expiry ?? null,
                                certIsPresent: domain.certificate?.is_present ?? false,
                                certIsManaged: domain.certificate?.is_managed ?? false,
                                certIsPubliclySeen: domain.certificate?.is_publicly_seen ?? false,
                                registryCertificateId: domain.certificate?.registry_certificate_id ?? null,
                                renewalConfigurationId: domain.certificate?.renewal_configuration_id ?? null,
                                renewalConfigurationName: domain.certificate?.renewal_configuration_name ?? null,
                                renewsDaysBeforeExpiry: domain.certificate?.renews_days_before_expiry ?? null,
                                scheduledRenewalDate: domain.certificate?.scheduled_renewal_date ?? null,
                            });
                        }
                    }
                }

                return rows;
            })
        );
    }

    // 🟩 Helper method to consistently build fallback records for empty tree states
    private createEmptyRowPlaceholder(agent: AgentResponse, service: ServiceData | null, domain: DomainData | null): AgentCertificateRowFlat { // 🟩
        return { // 🟩
            agentId: agent.id, // 🟩
            agentIdentity: agent.agent_identity, // 🟩
            hostname: agent.hostname, // 🟩
            isOnline: agent.is_online, // 🟩
            // 🟩
            serviceId: service?.service_id ?? '', // 🟩
            serviceName: service?.name ?? '(No Active Services)', // 🟩
            // 🟩
            domainName: domain?.domain_name ?? '(No Endpoints Discovered)', // 🟩
            domainLastSeen: domain?.last_seen ?? '', // 🟩
            // 🟩
            certPath: null, // 🟩
            Issuer: null, // 🟩
            certExpiry: null, // 🟩
            certIsPresent: false, // 🟩
            certIsManaged: false, // 🟩
            certIsPubliclySeen: false, // 🟩
            registryCertificateId: null, // 🟩
            renewalConfigurationId: null, // 🟩
            renewalConfigurationName: null, // 🟩
            renewsDaysBeforeExpiry: null, // 🟩
            scheduledRenewalDate: null // 🟩
        }; // 🟩
    } // 🟩

}
