import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: false,
  template: `
    <div class="cdl-card" [class.cdl-card--clickable]="clickable">
      <div class="cdl-card__header" *ngIf="title">
        <h3>{{title}}</h3>
        <p *ngIf="subtitle">{{subtitle}}</p>
      </div>
      <div class="cdl-card__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .cdl-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .cdl-card__header h3 { margin: 0; font-size: 18px; }
    .cdl-card--clickable { cursor: pointer; transition: transform 0.2s; }
    .cdl-card--clickable:hover { transform: translateY(-2px); }
  `]
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() clickable: boolean = false;
}