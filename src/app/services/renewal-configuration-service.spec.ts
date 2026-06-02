import { TestBed } from '@angular/core/testing';

import { RenewalConfigurationService } from './renewal-configuration-service';

describe('RenewalConfigurationService', () => {
  let service: RenewalConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenewalConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
