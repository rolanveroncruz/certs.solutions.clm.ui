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

  describe('delete stale API methods', () => {
    it('should send DELETE request to /stale/services/:service_id', () => {
      let completed = false;
      service.deleteStaleService('svc-123').subscribe({
        next: () => {
          completed = true;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/services/svc-123') && r.method === 'DELETE');
      expect(req.request.headers.has('Authorization')).toBeTrue();
      req.flush(null, { status: 204, statusText: 'No Content' });
      expect(completed).toBeTrue();
    });

    it('should properly handle 409 Conflict when deleting a stale service', () => {
      let errorReceived: any = null;
      service.deleteStaleService('svc-123').subscribe({
        next: () => fail('Should have failed with 409'),
        error: (err) => {
          errorReceived = err;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/services/svc-123') && r.method === 'DELETE');
      req.flush('Service is active and no longer stale', { status: 409, statusText: 'Conflict' });

      expect(errorReceived).toBeTruthy();
      expect(errorReceived.status).toBe(409);
      expect(errorReceived.message).toBe('Service is active and no longer stale');
    });

    it('should properly handle 404 Not Found when deleting a stale service', () => {
      let errorReceived: any = null;
      service.deleteStaleService('svc-123').subscribe({
        next: () => fail('Should have failed with 404'),
        error: (err) => {
          errorReceived = err;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/services/svc-123') && r.method === 'DELETE');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeTruthy();
      expect(errorReceived.status).toBe(404);
      expect(errorReceived.message).toBe('The service was not found or has already been removed.');
    });

    it('should send DELETE request to /stale/domains/:domain_id', () => {
      let completed = false;
      service.deleteStaleDomain('dom-456').subscribe({
        next: () => {
          completed = true;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/domains/dom-456') && r.method === 'DELETE');
      expect(req.request.headers.has('Authorization')).toBeTrue();
      req.flush(null, { status: 204, statusText: 'No Content' });
      expect(completed).toBeTrue();
    });

    it('should handle errors when deleting a stale domain', () => {
      let errorReceived: any = null;
      service.deleteStaleDomain('dom-456').subscribe({
        next: () => fail('Should have failed with 409'),
        error: (err) => {
          errorReceived = err;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/domains/dom-456') && r.method === 'DELETE');
      req.flush(null, { status: 409, statusText: 'Conflict' });

      expect(errorReceived).toBeTruthy();
      expect(errorReceived.status).toBe(409);
      expect(errorReceived.message).toBe('The domain is no longer stale and cannot be deleted.');
    });

    it('should send DELETE request to /stale/deployments/:deployment_id', () => {
      let completed = false;
      service.deleteStaleCertDeployment('dep-789').subscribe({
        next: () => {
          completed = true;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/deployments/dep-789') && r.method === 'DELETE');
      expect(req.request.headers.has('Authorization')).toBeTrue();
      req.flush(null, { status: 204, statusText: 'No Content' });
      expect(completed).toBeTrue();
    });

    it('should handle generic errors when deleting a stale deployment', () => {
      let errorReceived: any = null;
      service.deleteStaleCertDeployment('dep-789').subscribe({
        next: () => fail('Should have failed with 500'),
        error: (err) => {
          errorReceived = err;
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/stale/deployments/dep-789') && r.method === 'DELETE');
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeTruthy();
      expect(errorReceived.status).toBe(500);
      expect(errorReceived.message).toBe('Internal Server Error');
    });
  });
});
