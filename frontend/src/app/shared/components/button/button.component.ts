// ============================================
// Button Component - CLEAN VERSION
// ============================================
// NO standalone, NO imports array
// Location: frontend/src/app/shared/components/button/button.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: false,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() ariaLabel?: string;
  
  @Output() clicked = new EventEmitter<Event>();
  
  /**
   * Get computed CSS classes for the button
   */
  get buttonClasses(): string {
    const classes = [
      'cdl-button',
      `cdl-button--${this.variant}`,
      `cdl-button--${this.size}`
    ];
    
    if (this.fullWidth) {
      classes.push('cdl-button--full-width');
    }
    
    if (this.loading) {
      classes.push('cdl-button--loading');
    }
    
    if (!this.label && this.icon) {
      classes.push('cdl-button--icon-only');
    }
    
    return classes.join(' ');
  }
  
  /**
   * Handle button click
   */
  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
