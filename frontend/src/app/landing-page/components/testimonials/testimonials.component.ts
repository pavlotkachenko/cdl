import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

interface Testimonial {
  name: string;
  photo: string;
  review: string;
  rating: number;
  position?: string;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit, OnDestroy {
  testimonials: Testimonial[] = [
    {
      name: 'Maria N.',
      photo: 'assets/images/girl-1.png',
      review: 'Excellent service! They helped me resolve my ticket quickly and professionally. The team was responsive and kept me informed throughout the entire process. I highly recommend their services.',
      rating: 5,
      position: 'Professional Driver'
    },
    {
      name: 'Juan P.',
      photo: 'assets/images/girl-2.png',
      review: 'Outstanding experience! The safety experts at this company are top-notch. They provided comprehensive support and guidance that exceeded my expectations. Worth every penny!',
      rating: 5,
      position: 'Fleet Manager'
    },
    {
      name: 'Sarah K.',
      photo: 'assets/images/girl-1.png',
      review: 'Professional and efficient! They handled my MVR issues with expertise and care. The process was smooth and stress-free. I would definitely use their services again.',
      rating: 5,
      position: 'Owner Operator'
    },
    {
      name: 'Michael R.',
      photo: 'assets/images/girl-2.png',
      review: 'Best decision I made for my trucking business! Their compliance management services have been invaluable. The team is knowledgeable, professional, and always available to help.',
      rating: 5,
      position: 'Carrier Owner'
    }
  ];

  currentIndex: number = 0;
  private intervalId: any;

  ngOnInit(): void {
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startAutoRotate(): void {
    this.intervalId = setInterval(() => {
      this.nextTestimonial();
    }, 6000);
  }

  nextTestimonial(): void {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  previousTestimonial(): void {
    this.currentIndex = this.currentIndex === 0 ? this.testimonials.length - 1 : this.currentIndex - 1;
  }

  goToTestimonial(index: number): void {
    this.currentIndex = index;
  }

  get currentTestimonial(): Testimonial {
    return this.testimonials[this.currentIndex];
  }

  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
