import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { LandingComponent } from './landing.component';
import { LandingHeaderComponent } from './components/landing-header/landing-header.component';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';

const routes: Routes = [{ path: '', component: LandingComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LandingComponent,
    LandingHeaderComponent,
    LandingFooterComponent
  ]
})
export class LandingModule { }