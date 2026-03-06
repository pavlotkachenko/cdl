import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect } from 'vitest';

import { OfflineComponent } from './offline.component';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [OfflineComponent, NoopAnimationsModule],
  }).compileComponents();
  const fixture = TestBed.createComponent(OfflineComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('OfflineComponent', () => {
  it('renders the offline heading', async () => {
    const { fixture } = await setup();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.textContent).toContain("You're offline");
  });

  it('renders the wifi_off icon', async () => {
    const { fixture } = await setup();
    const icon = fixture.nativeElement.querySelector('mat-icon.offline-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('wifi_off');
  });

  it('renders the Try Again button', async () => {
    const { fixture } = await setup();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Try Again');
  });

  it('component exposes a reload method', async () => {
    const { component } = await setup();
    expect(typeof component.reload).toBe('function');
  });
});
