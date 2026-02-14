// ============================================
// Terms of Service Component
// Location: frontend/src/app/features/legal/terms/terms.component.ts
// ============================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-terms',
  standalone: true,
  templateUrl: './terms.component.html',
  styleUrls: ['../privacy/privacy.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class TermsComponent {
  lastUpdated = 'February 11, 2026';
}
