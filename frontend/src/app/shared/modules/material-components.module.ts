import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatCardModule,
    MatExpansionModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  exports: [
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatCardModule,
    MatExpansionModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class MaterialComponentsModule {}
