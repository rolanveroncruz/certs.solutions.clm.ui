export interface AcquireCertRequest {
    agent_id: string;
    domain_name: string;
    organization?: string;
    organizational_units?: string[];
    country?: string;
    province?: string;
    locality?: string;
    email_address?: string;
    sans?: string[];
    renewal_configuration_id?: string | null;
    provider_id: string;
}

export interface AcquireCertResponse {
    status: 'queued';
    message: string;
    command_id: string;
}
