import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jasmine-axe';

import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  let component: NotFoundPageComponent;
  let fixture: ComponentFixture<NotFoundPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotFoundPageComponent],
    }).compileComponents();
    jasmine.addMatchers(toHaveNoViolations);

    fixture = TestBed.createComponent(NotFoundPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass accessibility test', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
