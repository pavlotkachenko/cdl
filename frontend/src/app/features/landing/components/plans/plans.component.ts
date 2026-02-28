import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

import { LandingHeaderComponent } from '../landing-header/landing-header.component';
import { LandingFooterComponent } from '../landing-footer/landing-footer.component';

interface OptionPlan {
  text: string;
  tooltip?: string;
}

interface AccountPlanCard {
  title: string;
  price: string;
  priceTime?: string;
  subTitle: string;
  description: string;
  options: OptionPlan[];
  buttonText: string;
}

interface Question {
  title: string;
  text: string;
}

const OPTION_PLANS: Record<string, OptionPlan> = {
  UNLIMITED_TICKETS_SUBMISSIONS: {
    text: 'Unlimited tickets submissions',
    tooltip: 'You can submit any of your tickets and citations without restriction',
  },
  EVALUATION_WITHIN_24H: {
    text: 'Evaluation within 24h',
    tooltip: 'We will review your case and come back with possible solutions and price within 24h after submission',
  },
  FREE_PHONE_CONSULTATION: {
    text: '1 free phone consultation',
    tooltip:
      'We offer 1 free consultation with the safety advisor for all new clients. You can ask any questions and get qualified advice',
  },
  PHONE_CONSULTATION: {
    text: 'Phone consultations',
    tooltip: 'Talk to your personal safety advisor anytime during the office hours',
  },
  LAWYER_OR_COMPLETE_CASE_SUPPORT: {
    text: '1on1 lawyer or complete case support',
    tooltip:
      'Get match with the lawyer to work directly or get a complete case support with minimum input from your side',
  },
  PSP_EXAMINATION_INCLUDED: {
    text: 'PSP examination included',
    tooltip: 'We will exam and explain your PSP report for free',
  },
  UNLIMITED_PHONE_CONSULTATION: {
    text: 'Unlimited phone consultations',
    tooltip: 'Talk to your personal safety advisor anytime during the office hours',
  },
  LAWYER_AND_COURT_FEES_INCLUDED: {
    text: 'Lawyer & Court fees included for 2 tickets per year.',
    tooltip: 'You are not paying extra for any lawyer and court fees. Everything is included in your package',
  },
  MVR_RSP_EXAMINATION: {
    text: 'MVR & PSP examination included',
    tooltip: 'We will exam and explain your MVR & PSP report for free',
  },
  SUPPORT: {
    text: '24/7 support',
    tooltip: 'Receive safety support at any time',
  },
  SERIOUS_CASES: {
    text: 'Serious cases we cover up to $1000',
  },
  ATTORNEY_REPRESENTATION: {
    text: 'Attorney & Court fees are covered up to $2500',
  },
};

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    LandingHeaderComponent,
    LandingFooterComponent,
  ],
})
export class PlansComponent {
  plans: AccountPlanCard[] = [
    {
      title: 'Starter',
      price: 'Free',
      subTitle: 'New accounts starts here',
      description: 'Free forever, that gives you freedom to use it only when you need it.',
      options: [
        OPTION_PLANS['UNLIMITED_TICKETS_SUBMISSIONS'],
        OPTION_PLANS['EVALUATION_WITHIN_24H'],
        OPTION_PLANS['FREE_PHONE_CONSULTATION'],
      ],
      buttonText: 'Free plan',
    },
    {
      title: 'Driver Unlimited',
      price: '$40',
      priceTime: 'month',
      subTitle: 'Get covered',
      description: 'You will get all around CDL support with no extra fees and charges.',
      options: [
        OPTION_PLANS['UNLIMITED_TICKETS_SUBMISSIONS'],
        OPTION_PLANS['EVALUATION_WITHIN_24H'],
        OPTION_PLANS['UNLIMITED_PHONE_CONSULTATION'],
        OPTION_PLANS['LAWYER_OR_COMPLETE_CASE_SUPPORT'],
        OPTION_PLANS['PSP_EXAMINATION_INCLUDED'],
        OPTION_PLANS['LAWYER_AND_COURT_FEES_INCLUDED'],
        OPTION_PLANS['MVR_RSP_EXAMINATION'],
        OPTION_PLANS['SUPPORT'],
        OPTION_PLANS['SERIOUS_CASES'],
      ],
      buttonText: 'Subscribe',
    },
    {
      title: 'Driver Gold',
      price: '$100',
      priceTime: 'month',
      subTitle: 'Everything included',
      description: 'Get access to best traffic lawyers and safety advisers.',
      options: [
        OPTION_PLANS['UNLIMITED_PHONE_CONSULTATION'],
        OPTION_PLANS['LAWYER_OR_COMPLETE_CASE_SUPPORT'],
        OPTION_PLANS['PSP_EXAMINATION_INCLUDED'],
        OPTION_PLANS['MVR_RSP_EXAMINATION'],
        OPTION_PLANS['SUPPORT'],
        OPTION_PLANS['PSP_EXAMINATION_INCLUDED'],
        OPTION_PLANS['ATTORNEY_REPRESENTATION'],
      ],
      buttonText: 'Subscribe',
    },
  ];

  questions: Question[] = [
    {
      title: 'When should I hire a lawyer for a traffic ticket?',
      text: 'You may want to hire a lawyer if you are at risk of losing your license or facing jail time. A lawyer also may be helpful if you are considering fighting a ticket on the basis of a novel or complex legal argument. Otherwise, traffic law is not especially complex, and the stakes are not usually high, so a driver probably can handle the process on their own without undertaking this additional expense.',
    },
    {
      title: 'Can I continue to drive when my license is suspended if I need to get to work or school?',
      text: 'In some cases, a driver may be able to get a restricted license or hardship license, which allows them to drive during the period of the suspension for limited, essential purposes, such as going to work or school. If you do not get a hardship license, you should do your best to get rides from other people or use public transportation. Driving while your license is suspended if you do not have a hardship license is an additional, more serious violation, which can lead to more substantial fines and even jail time. It is not worth the risk.',
    },
    {
      title: 'What if the officer stopped me because of my race?',
      text: 'Sometimes a driver will suspect that the officer pulled them over because of racial profiling. If the officer has a reasonable suspicion that a driver is committing a traffic violation or a crime, they have a constitutional right to pull over that driver. However, this can serve as a pretext for making a driver uncomfortable so that they leave the area or for harassing a driver whom the officer has a personal reason to dislike. If an officer stops a driver based on their race, the driver may have a constitutional claim under the Equal Protection Clause.',
    },
    {
      title: 'What are the differences between traffic tickets and other crimes?',
      text: 'Traffic tickets usually lead to less severe consequences than regular crimes. A driver rarely faces jail time. Traffic court uses less formal procedures, and a driver often does not have a right to a jury trial. The standard of proof sometimes is more lenient than in a criminal case.',
    },
    {
      title: 'How does radar track my speed, and how is laser detection different?',
      text: 'Radar involves sending out radio waves and listening to how their frequency changes when they strike an object, such as a vehicle. This is an effective speed tracking device because the speed of the vehicle or other object affects the change in frequency. By contrast, laser detection measures the speed of a vehicle by sending out laser light and measuring the distance from the laser gun to the vehicle over time.',
    },
    {
      title: 'Do police officers need to meet quotas in issuing tickets?',
      text: 'This is not literally true. Like any other employee, though, a police officer will be evaluated according to their performance. If they never make a stop or issue a ticket, their superiors may question whether they are doing their job. The number of citations issued by a certain officer in a certain period has no impact on whether a citation is valid.',
    },
  ];
}
