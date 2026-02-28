import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss'
})
export class TestimonialsComponent {
  currentIndex = 0;

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'IT Manager',
      company: 'TechCorp Inc.',
      text: 'This ticket management system has revolutionized our support process. Response times are down 60% and customer satisfaction is at an all-time high.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Operations Director',
      company: 'Global Solutions Ltd.',
      text: 'Outstanding service! The team is responsive, professional, and always goes above and beyond to resolve our issues quickly.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Product Manager',
      company: 'Innovation Hub',
      text: 'The best ticketing system we\'ve used. Intuitive interface, powerful features, and exceptional support team. Highly recommended!',
      rating: 5
    },
    {
      name: 'David Thompson',
      role: 'CTO',
      company: 'StartupXYZ',
      text: 'Impressed by the efficiency and organization. Our team can now track and manage tickets seamlessly across departments.',
      rating: 5
    },
    {
      name: 'Lisa Anderson',
      role: 'Customer Success Lead',
      company: 'ServicePro',
      text: 'Game-changer for our customer support. The analytics and reporting features help us continuously improve our service quality.',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'IT Coordinator',
      company: 'Enterprise Systems',
      text: 'Reliable, fast, and user-friendly. Our ticket resolution rate has improved significantly since implementing this system.',
      rating: 5
    },
    {
      name: 'Maria Garcia',
      role: 'Support Manager',
      company: 'CloudTech Solutions',
      text: 'Excellent platform with great automation features. It has streamlined our workflow and reduced manual tasks considerably.',
      rating: 5
    },
    {
      name: 'Robert Taylor',
      role: 'VP of Operations',
      company: 'MegaCorp Industries',
      text: 'Professional service from start to finish. The system integrates perfectly with our existing tools and processes.',
      rating: 5
    },
    {
      name: 'Jennifer Lee',
      role: 'Technical Director',
      company: 'Digital Dynamics',
      text: 'Fantastic experience! The platform is robust, scalable, and has all the features we need to manage our growing support demands.',
      rating: 5
    }
  ];

  nextTestimonial() {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  previousTestimonial() {
    this.currentIndex = this.currentIndex === 0 ? this.testimonials.length - 1 : this.currentIndex - 1;
  }

  goToTestimonial(index: number) {
    this.currentIndex = index;
  }
}
