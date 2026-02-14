// ============================================
// Shared Module - FINAL FIXED
// ============================================
// Location: frontend/src/app/shared/shared.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// Наши компоненты (Убедись, что файлы существуют!)
import { ButtonComponent } from './components/button/button.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { CardComponent } from './components/card/card.component';

import { InputComponent } from './components/input/input.component'; // Добавь этот импорт

@NgModule({
  declarations: [
    ButtonComponent,
    StatusBadgeComponent,
    CardComponent, // Декларируем здесь
    InputComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule
    // ФИКС: УДАЛИЛИ CardComponent отсюда. Компоненты не импортируются!
  ],
  exports: [
    ButtonComponent,
    StatusBadgeComponent,
    CardComponent, // Экспортируем, чтобы другие модули его видели
    InputComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule
  ]
})
export class SharedModule { }