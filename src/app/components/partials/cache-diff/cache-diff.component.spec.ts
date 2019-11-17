import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CacheDiffComponent } from './cache-diff.component';

describe('CacheDiffComponent', () => {
  let component: CacheDiffComponent;
  let fixture: ComponentFixture<CacheDiffComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CacheDiffComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CacheDiffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
