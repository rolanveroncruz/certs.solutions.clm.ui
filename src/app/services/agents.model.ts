export interface CertDeployment {
    cert_path: string;
    issuer: string;
    expiry: string; // Go time.Time becomes ISO string in JSON
    is_present: boolean;
    is_managed: boolean;
    is_publicly_seen: boolean;
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

