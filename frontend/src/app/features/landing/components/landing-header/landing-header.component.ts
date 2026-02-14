import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component'
// Angular Material Imports
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-landing-header',
  templateUrl: './landing-header.component.html',
  styleUrls: ['./landing-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    NotificationBellComponent,
    MatBadgeModule,
    MatMenuModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule
  ]
})
export class LandingHeaderComponent {
  constructor(private router: Router) {}

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToSignIn(): void {
    this.router.navigate(['/login']);
  }
}