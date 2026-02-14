import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input',
  standalone: false,
  template: `
    <div class="cdl-input-group">
      <label *ngIf="label">{{ label }}</label>
      <input 
        [type]="type" 
        [placeholder]="placeholder" 
        class="cdl-input"
      >
    </div>
  `,
  styles: [`
    .cdl-input-group { margin-bottom: 15px; width: 100%; }
    label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 14px; }
    .cdl-input { 
      width: 100%; 
      height: 45px; 
      padding: 0 15px; 
      border: 1px solid #e5eaee; 
      border-radius: 8px; 
      outline: none;
    }
    .cdl-input:focus { border-color: #1dad8c; }
  `]
})
export class InputComponent {
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
}