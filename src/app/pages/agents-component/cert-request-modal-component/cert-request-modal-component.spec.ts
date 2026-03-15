import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertRequestModalComponent } from './cert-request-modal-component';

describe('CertRequestModalComponent', () => {
  let component: CertRequestModalComponent;
  let fixture: ComponentFixture<CertRequestModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertRequestModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertRequestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
