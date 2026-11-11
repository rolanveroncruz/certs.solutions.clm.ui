import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
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
    private readonly staleApiUrl = `${environment.apiBaseUrl}/stale`;
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
                                serviceStale: service.stale ?? false,
                                serviceStaleSince: service.stale_since ?? null,

                                domainId: (domain as any).domain_id ?? (domain as any).id ?? domain.domain_name,
                                domainName: domain.domain_name,
                                domainLastSeen: domain.last_seen,
                                domainStale: domain.stale ?? false,
                                domainStaleSince: domain.stale_since ?? null,

                                deploymentId: (domain.certificate as any)?.deployment_id ?? (domain.certificate as any)?.id ?? domain.certificate?.registry_certificate_id ?? domain.certificate?.cert_path ?? null,
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
                                providerId: domain.certificate?.provider_id ?? null,
                                providerName: domain.certificate?.provider_name ?? null,
                                certStale: domain.certificate?.stale ?? false,
                                certStaleSince: domain.certificate?.stale_since ?? null,
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
            serviceStale: service?.stale ?? false,
            serviceStaleSince: service?.stale_since ?? null,
            // 🟩
            domainId: (domain as any)?.domain_id ?? (domain as any)?.id ?? domain?.domain_name ?? '',
            domainName: domain?.domain_name ?? '(No Endpoints Discovered)', // 🟩
            domainLastSeen: domain?.last_seen ?? '', // 🟩
            domainStale: domain?.stale ?? false,
            domainStaleSince: domain?.stale_since ?? null,
            // 🟩
            deploymentId: null,
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
            scheduledRenewalDate: null, // 🟩
            providerId: null,
            providerName: null,
            certStale: false,
            certStaleSince: null,
        }; // 🟩
    } // 🟩
// Inside agents-service.ts

// ✅ Add this helper to extract all certificates from the agent tree
    getAllCertificates(agents: AgentResponse[]): any[] {
        const certs: any[] = [];
        agents.forEach(agent => {
            agent.services?.forEach(service => {
                service.domains?.forEach(domain => {
                    if (domain.certificate) {
                        certs.push(domain.certificate);
                    }
                });
            });
        });
        return certs;
    }

    private handleStaleDeleteError(err: HttpErrorResponse, entityType: string): Observable<never> {
        let message: string;
        if (err.status === 409) {
            message = (typeof err.error === 'string' && err.error) || `The ${entityType} is no longer stale and cannot be deleted.`;
        } else if (err.status === 404) {
            message = (typeof err.error === 'string' && err.error) || `The ${entityType} was not found or has already been removed.`;
        } else {
            message = (typeof err.error === 'string' && err.error) || err.error?.message || `Failed to delete stale ${entityType}.`;
        }
        console.error(`Failed to delete stale ${entityType} (${err.status}):`, message, err);
        const error = new Error(message);
        (error as any).status = err.status;
        (error as any).error = err.error;
        return throwError(() => error);
    }

    // DELETE /api/v1/stale/services/{service_id}
    // Deletes one stale service. Its ports, domains and deployments are removed with it.
    deleteStaleService(service_id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.staleApiUrl}/services/${encodeURIComponent(service_id)}`,
            { headers: this.authHeaders() }
        ).pipe(
            catchError((err: HttpErrorResponse) => this.handleStaleDeleteError(err, 'service'))
        );
    }

    // DELETE /api/v1/stale/domains/{domain_id}
    // Deletes one stale domain, plus the stale deployments of the same service
    // whose server_name equals the domain name.
    deleteStaleDomain(domain_id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.staleApiUrl}/domains/${encodeURIComponent(domain_id)}`,
            { headers: this.authHeaders() }
        ).pipe(
            catchError((err: HttpErrorResponse) => this.handleStaleDeleteError(err, 'domain'))
        );
    }

    // DELETE /api/v1/stale/deployments/{deployment_id}
    // Deletes one stale certificate deployment and nothing else.
    deleteStaleCertDeployment(deployment_id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.staleApiUrl}/deployments/${encodeURIComponent(deployment_id)}`,
            { headers: this.authHeaders() }
        ).pipe(
            catchError((err: HttpErrorResponse) => this.handleStaleDeleteError(err, 'certificate deployment'))
        );
    }
}
