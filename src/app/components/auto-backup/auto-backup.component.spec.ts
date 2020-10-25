import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoBackupComponent } from './auto-backup.component';

describe('AutoBackupComponent', () => {
  let component: AutoBackupComponent;
  let fixture: ComponentFixture<AutoBackupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoBackupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoBackupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
