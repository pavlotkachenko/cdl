import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LandingHeaderComponent } from '../landing-header/landing-header.component';
import { LandingFooterComponent } from '../landing-footer/landing-footer.component';

@Component({
  selector: 'app-contact-us-page',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    LandingHeaderComponent,
    LandingFooterComponent
  ]
})
export class ContactUsPageComponent {
  flagNames: string[] = ['usa', 'ru', 'ro', 'mexica', 'poland', 'ukraine'];
}
