import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-hero-section',
  imports: [MatButtonModule, TranslateModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  currentIndex = 0;
  interval: ReturnType<typeof setInterval> | undefined;

  heroImages = [
    'assets/images/hero-1.jpg',
    'assets/images/hero-2.jpg',
    'assets/images/hero-3.jpg',
    'assets/images/hero-4.jpg',
    'assets/images/hero-5.jpg'
  ];

  headlineKeys = [
    'LANDING.HERO_1',
    'LANDING.HERO_2',
    'LANDING.HERO_3',
    'LANDING.HERO_4',
    'LANDING.HERO_5'
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
