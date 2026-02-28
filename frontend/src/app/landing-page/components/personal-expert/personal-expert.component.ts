import { Component } from '@angular/core';

@Component({
  selector: 'app-personal-expert',
  templateUrl: './personal-expert.component.html',
  styleUrls: ['./personal-expert.component.scss']
})
export class PersonalExpertComponent {
  features = [
    {
      icon: 'assets/icons/shield.svg',
      title: '24/7 Support',
      description: 'Round-the-clock assistance from our expert team'
    },
    {
      icon: 'assets/icons/users.svg',
      title: 'Certified Experts',
      description: 'Work with industry-certified safety professionals'
    },
    {
      icon: 'assets/icons/chart-bar.svg',
      title: 'Proven Results',
      description: '100% success rate in ticket resolution'
    }
  ];
}
