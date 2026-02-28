import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  currentIndex = 0;
  interval: any;

  heroImages = [
    'assets/images/hero-1.jpg',
    'assets/images/hero-2.jpg',
    'assets/images/hero-3.jpg',
    'assets/images/hero-4.jpg',
    'assets/images/hero-5.jpg'
  ];

  headlines = [
    'We are #1 advisor<br/>in the trucking industry',
    '100% tickets<br/>resolution rate',
    'Safety consulting<br/>for trucking companies',
    'Services<br/>for drivers',
    'We are proud<br/>of our team'
  ];

  ngOnInit() {
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % 5;
    }, 5000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }
}
