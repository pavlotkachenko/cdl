import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LandingHeaderComponent } from '../landing-header/landing-header.component';
import { LandingFooterComponent } from '../landing-footer/landing-footer.component';

interface Pillar {
  icon: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    LandingHeaderComponent,
    LandingFooterComponent
  ]
})
export class AboutUsComponent {
  pillars: Pillar[] = [
    {
      icon: 'unique-case',
      title: 'Every case is unique',
      content:
        'We believe that every case is unique and requires careful attention to details at every step of the way',
    },
    {
      icon: 'long-term',
      title: 'We establish long term relations',
      content:
        'Our hard effort and passion helps us to create strong relations. We believe that the satisfaction of our clients makes our company the greatest.',
    },
    {
      icon: 'keep-word',
      title: 'We keep our word',
      content: 'Your case is very important to us. Every successful case becomes our success.',
    },
  ];

  partners: string[] = ['pony-express-logo', 'klm', 'cb-freight', 'mgl'];
}
