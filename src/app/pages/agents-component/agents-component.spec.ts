import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AgentsComponent } from './agents-component';

describe('AgentsComponent', () => {
  let component: AgentsComponent;
  let fixture: ComponentFixture<AgentsComponent>;

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
});
