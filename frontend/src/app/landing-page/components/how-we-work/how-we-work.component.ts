import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface ProcessStep {
  stepNumber: number;
  icon: string;
  titleKey: string;
  descKey: string;
}

@Component({
  selector: 'app-how-we-work',
  imports: [CommonModule, TranslateModule],
  templateUrl: './how-we-work.component.html',
  styleUrls: ['./how-we-work.component.scss']
})
export class HowWeWorkComponent {
  processSteps: ProcessStep[] = [
    {
      stepNumber: 1,
      icon: 'assets/icons/clipboard-check.svg',
      titleKey: 'LANDING.HOW_STEP1_TITLE',
      descKey: 'LANDING.HOW_STEP1_DESC'
    },
    {
      stepNumber: 2,
      icon: 'assets/icons/users.svg',
      titleKey: 'LANDING.HOW_STEP2_TITLE',
      descKey: 'LANDING.HOW_STEP2_DESC'
    },
    {
      stepNumber: 3,
      icon: 'assets/icons/file-text.svg',
      titleKey: 'LANDING.HOW_STEP3_TITLE',
      descKey: 'LANDING.HOW_STEP3_DESC'
    },
    {
      stepNumber: 4,
      icon: 'assets/icons/shield.svg',
      titleKey: 'LANDING.HOW_STEP4_TITLE',
      descKey: 'LANDING.HOW_STEP4_DESC'
    }
  ];
}
