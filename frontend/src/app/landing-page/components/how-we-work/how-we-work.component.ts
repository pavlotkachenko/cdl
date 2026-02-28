import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProcessStep {
  stepNumber: number;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-we-work',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-we-work.component.html',
  styleUrls: ['./how-we-work.component.scss']
})
export class HowWeWorkComponent {
  processSteps: ProcessStep[] = [
    {
      stepNumber: 1,
      icon: 'assets/icons/clipboard-check.svg',
      title: 'Submit Your Request',
      description: 'Fill out our simple form with your ticket or service request details.'
    },
    {
      stepNumber: 2,
      icon: 'assets/icons/users.svg',
      title: 'Expert Review',
      description: 'Our certified safety experts review your case and develop a strategy.'
    },
    {
      stepNumber: 3,
      icon: 'assets/icons/file-text.svg',
      title: 'Professional Handling',
      description: 'We handle all documentation and communication on your behalf.'
    },
    {
      stepNumber: 4,
      icon: 'assets/icons/shield.svg',
      title: 'Resolution & Support',
      description: 'Get the best possible outcome with ongoing support and guidance.'
    }
  ];
}
