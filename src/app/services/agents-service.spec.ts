import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AgentsService } from './agents-service';
import { AgentResponse } from './agents.model';

describe('AgentsService', () => {
  let service: AgentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AgentsService
      ]
    });
    service = TestBed.inject(AgentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should correctly map stale and stale_since fields from agent hierarchy into flat rows', () => {
    const mockAgents: AgentResponse[] = [
      {
        id: 'agent-1',
        agent_identity: 'agent-identity-1',
        hostname: 'host-1',
        is_online: true,
        services: [
          {
            service_id: 'svc-1',
            name: 'Web Service',
            stale: true,
            stale_since: '2026-11-01T12:00:00Z',
            domains: [
              {
                domain_name: 'example.com',
                last_seen: '2026-11-05T10:00:00Z',
                stale: false,
                stale_since: null,
                certificate: {
                  cert_path: '/etc/ssl/cert.pem',
                  issuer: 'Let\'s Encrypt',
                  expiry: '2026-12-01T00:00:00Z',
                  is_present: true,
                  is_managed: true,
                  is_publicly_seen: true,
                  registry_certificate_id: 'reg-1',
                  renewal_configuration_id: 'cfg-1',
                  renewal_configuration_name: 'Prod Renewal',
                  renews_days_before_expiry: 30,
                  scheduled_renewal_date: '2026-11-15T00:00:00Z',
                  provider_id: 'prov-1',
                  provider_name: 'Cert Provider',
                  stale: true,
                  stale_since: '2026-11-02T15:30:00Z'
                }
              }
            ]
          }
        ]
      }
    ];

    service.listAgentsAsRows(1).subscribe(rows => {
      expect(rows.length).toBe(1);
      const row = rows[0];
      expect(row.agentId).toBe('agent-1');
      expect(row.serviceName).toBe('Web Service');
      expect(row.serviceStale).toBe(true);
      expect(row.serviceStaleSince).toBe('2026-11-01T12:00:00Z');
      expect(row.domainName).toBe('example.com');
      expect(row.domainStale).toBe(false);
      expect(row.domainStaleSince).toBeNull();
      expect(row.certStale).toBe(true);
      expect(row.certStaleSince).toBe('2026-11-02T15:30:00Z');
    });

    const req = httpMock.expectOne(req => req.url.includes('/agents'));
    req.flush(mockAgents);
  });
});
