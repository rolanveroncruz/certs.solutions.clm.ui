import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateEnrollmentTokenDialog } from './generate-enrollment-token-dialog';

describe('GenerateEnrollmentTokenDialog', () => {
  let component: GenerateEnrollmentTokenDialog;
  let fixture: ComponentFixture<GenerateEnrollmentTokenDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateEnrollmentTokenDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateEnrollmentTokenDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
