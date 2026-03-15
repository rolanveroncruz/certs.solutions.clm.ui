import { TestBed } from '@angular/core/testing';

import { CertsService } from './certs-service';

describe('CertsService', () => {
  let service: CertsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CertsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
