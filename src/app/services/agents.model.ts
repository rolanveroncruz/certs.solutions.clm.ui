export interface CertDeployment {
    id?: string;
    deployment_id?: string;
    cert_path: string;
    issuer: string;
    expiry: string; // Go time.Time becomes ISO string in JSON
    is_present: boolean;
    is_managed: boolean;
    is_publicly_seen: boolean;
    registry_certificate_id: string | null;
    renewal_configuration_id: string | null;
    renewal_configuration_name: string | null;
    renews_days_before_expiry: number;
    scheduled_renewal_date: string | null;
    provider_id: string | null;
    provider_name: string | null;
    stale: boolean;
    stale_since: string | null;
}

export interface DomainData {
    id?: string;
    domain_id?: string;
    domain_name: string;
    last_seen: string; // Go time.Time becomes ISO string in JSON
    stale: boolean;
    stale_since: string | null;
    certificate: CertDeployment | null;
}

export interface ServiceData {
    service_id: string;
    name: string;
    stale: boolean;
    stale_since: string | null;
    domains: DomainData[];
}

export interface AgentResponse {
    id: string;
    agent_identity: string;
    hostname: string;
    is_online: boolean;
    last_discovery_requested_at: string;
    last_discovery_completed_at: string;
    last_successful_discovery_at: string;
    last_discovery_status: string;
    mtls_cert_issued_at: string;
    mtls_cert_expires_at: string;
    mtls_cert_days_remaining: number;
    services: ServiceData[];
}

export interface AgentCertificateRowFlat {
    // --- Agent Fields ---
    agentId: string;
    agentIdentity: string;
    hostname: string;
    isOnline: boolean;
    lastDiscoveryRequestedAt: string;
    lastDiscoveryCompletedAt: string;
    lastSuccessfulDiscoveryAt: string;
    lastDiscoveryStatus: string;
    mtlsCertIssuedAt: string;
    mtlsCertExpiresAt: string;
    mtlsCertDaysRemaining: number;

    // --- Service Fields ---
    serviceId: string;
    serviceName: string;
    serviceStale: boolean;
    serviceStaleSince: string | null;

    // --- Domain Fields ---
    domainId?: string;
    domainName: string;
    domainLastSeen: string; // ISO Date String
    domainStale: boolean;
    domainStaleSince: string | null;

    // --- Certificate Deployment Fields (Nullable if no cert exists) ---
    deploymentId?: string | null;
    certPath: string | null;
    Issuer: string | null;
    certExpiry: string | null; // ISO Date String
    certIsPresent: boolean;
    certIsManaged: boolean;
    certIsPubliclySeen: boolean;
    registryCertificateId: string | null;
    renewalConfigurationId: string | null;
    renewalConfigurationName: string | null;
    renewsDaysBeforeExpiry: number | null;
    scheduledRenewalDate: string | null; // ISO Date String
    providerId: string | null;
    providerName: string | null;
    certStale: boolean;
    certStaleSince: string | null;
}

