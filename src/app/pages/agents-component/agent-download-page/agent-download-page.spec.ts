import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentDownloadPage } from './agent-download-page';

describe('AgentDownloadPage', () => {
  let component: AgentDownloadPage;
  let fixture: ComponentFixture<AgentDownloadPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentDownloadPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentDownloadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
