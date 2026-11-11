import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AgentsComponent } from './agents-component';
import { AgentsService } from '../../services/agents-service';
import { AgentCertificateRowFlat } from '../../services/agents.model';

describe('AgentsComponent', () => {
  let component: AgentsComponent;
  let fixture: ComponentFixture<AgentsComponent>;
  let agentsService: AgentsService;

  const mockRow: AgentCertificateRowFlat = {
    agentId: 'agent-1',
    agentIdentity: 'agent-one',
    hostname: 'host-1',
    isOnline: true,
    serviceId: 'svc-123',
    serviceName: 'Web Service',
    serviceStale: true,
    serviceStaleSince: '2026-11-01T10:00:00Z',
    domainId: 'dom-456',
    domainName: 'example.com',
    domainLastSeen: '2026-11-01T10:00:00Z',
    domainStale: true,
    domainStaleSince: '2026-11-01T10:00:00Z',
    deploymentId: 'dep-789',
    certPath: '/etc/ssl/cert.pem',
    Issuer: 'Let\'s Encrypt',
    certExpiry: '2026-12-01T10:00:00Z',
    certIsPresent: true,
    certIsManaged: true,
    certIsPubliclySeen: true,
    registryCertificateId: 'reg-cert-1',
    renewalConfigurationId: null,
    renewalConfigurationName: null,
    renewsDaysBeforeExpiry: 30,
    scheduledRenewalDate: null,
    providerId: 'prov-1',
    providerName: 'Provider 1',
    certStale: true,
    certStaleSince: '2026-11-01T10:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentsComponent);
    component = fixture.componentInstance;
    agentsService = TestBed.inject(AgentsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure custom cell templates for service, domain, and issuer columns', () => {
    const serviceCol = component.columnDefs.find(c => c.key === 'serviceName');
    const domainCol = component.columnDefs.find(c => c.key === 'domainName');
    const issuerCol = component.columnDefs.find(c => c.key === 'Issuer');

    expect(serviceCol).toBeTruthy();
    expect(serviceCol?.customCellTemplate).toBe(component.ServiceCell);

    expect(domainCol).toBeTruthy();
    expect(domainCol?.customCellTemplate).toBe(component.DomainCell);

    expect(issuerCol).toBeTruthy();
    expect(issuerCol?.customCellTemplate).toBe(component.IssuerCell);
  });

  describe('Stale Item Deletion with Cascade Confirmation Prompts', () => {
    it('should prompt confirmation warning about cascading domain and cert deletion when deleting stale service', () => {
      const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
      const deleteServiceSpy = spyOn(agentsService, 'deleteStaleService').and.returnValue(of(undefined));
      const loadAgentsSpy = spyOn(component, 'loadAgents');

      component.deleteStaleService(mockRow);

      expect(confirmSpy).toHaveBeenCalled();
      const promptText = confirmSpy.calls.mostRecent()?.args[0] as string;
      expect(promptText?.toLowerCase()).toContain('deleting a stale service will also delete stale domains and certificate deployments');
      expect(deleteServiceSpy).toHaveBeenCalledWith('svc-123');
      expect(loadAgentsSpy).toHaveBeenCalled();
    });

    it('should not call deleteStaleService if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const deleteServiceSpy = spyOn(agentsService, 'deleteStaleService');

      component.deleteStaleService(mockRow);

      expect(deleteServiceSpy).not.toHaveBeenCalled();
    });

    it('should prompt confirmation warning about deleting associated certificate deployment when deleting stale domain', () => {
      const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
      const deleteDomainSpy = spyOn(agentsService, 'deleteStaleDomain').and.returnValue(of(undefined));
      const loadAgentsSpy = spyOn(component, 'loadAgents');

      component.deleteStaleDomain(mockRow);

      expect(confirmSpy).toHaveBeenCalled();
      const promptText = confirmSpy.calls.mostRecent()?.args[0] as string;
      expect(promptText?.toLowerCase()).toContain('deleting a stale domain will delete the associated certificate deployment');
      expect(deleteDomainSpy).toHaveBeenCalledWith('dom-456');
      expect(loadAgentsSpy).toHaveBeenCalled();
    });

    it('should not call deleteStaleDomain if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const deleteDomainSpy = spyOn(agentsService, 'deleteStaleDomain');

      component.deleteStaleDomain(mockRow);

      expect(deleteDomainSpy).not.toHaveBeenCalled();
    });

    it('should prompt confirmation when deleting stale certificate deployment', () => {
      const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
      const deleteCertSpy = spyOn(agentsService, 'deleteStaleCertDeployment').and.returnValue(of(undefined));
      const loadAgentsSpy = spyOn(component, 'loadAgents');

      component.deleteStaleCertDeployment(mockRow);

      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteCertSpy).toHaveBeenCalledWith('dep-789');
      expect(loadAgentsSpy).toHaveBeenCalled();
    });

    it('should not call deleteStaleCertDeployment if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const deleteCertSpy = spyOn(agentsService, 'deleteStaleCertDeployment');

      component.deleteStaleCertDeployment(mockRow);

      expect(deleteCertSpy).not.toHaveBeenCalled();
    });
  });
});
