export interface CertDeployment {
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
}

export interface DomainData {
    domain_name: string;
    last_seen: string; // Go time.Time becomes ISO string in JSON
    certificate: CertDeployment | null;
}

export interface ServiceData {
    service_id: string;
    name: string;
    domains: DomainData[];
}

export interface AgentResponse {
    id: string;
    agent_identity: string;
    hostname: string;
    is_online: boolean;
    services: ServiceData[];
}

export interface AgentCertificateRowFlat {
    // --- Agent Fields ---
    agentId: string;
    agentIdentity: string;
    hostname: string;
    isOnline: boolean;

    // --- Service Fields ---
    serviceId: string;
    serviceName: string;

    // --- Domain Fields ---
    domainName: string;
    domainLastSeen: string; // ISO Date String

    // --- Certificate Deployment Fields (Nullable if no cert exists) ---
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
}

