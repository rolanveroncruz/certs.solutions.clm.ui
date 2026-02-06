import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoveriesComponent } from './discoveries-component';

describe('DiscoveriesComponent', () => {
  let component: DiscoveriesComponent;
  let fixture: ComponentFixture<DiscoveriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoveriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscoveriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
