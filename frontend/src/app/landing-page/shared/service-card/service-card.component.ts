import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.scss']
})
export class ServiceCardComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
}
