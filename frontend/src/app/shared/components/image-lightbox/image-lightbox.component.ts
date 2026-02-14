// ============================================
// Image Lightbox Component - Click to Enlarge
// Location: frontend/src/app/shared/components/image-lightbox/image-lightbox.component.ts
// ============================================

import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface LightboxImage {
  url: string;
  title?: string;
  description?: string;
}

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  templateUrl: './image-lightbox.component.html',
  styleUrls: ['./image-lightbox.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class ImageLightboxComponent {
  @Input() images: LightboxImage[] = [];
  @Input() currentIndex: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() download = new EventEmitter<LightboxImage>();

  zoomLevel = 100;
  rotation = 0;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  imageOffsetX = 0;
  imageOffsetY = 0;

  get currentImage(): LightboxImage | null {
    return this.images[this.currentIndex] || null;
  }

  get hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  get hasNext(): boolean {
    return this.currentIndex < this.images.length - 1;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.onClose();
        break;
      case 'ArrowLeft':
        this.previous();
        break;
      case 'ArrowRight':
        this.next();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
        this.zoomOut();
        break;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  previous(): void {
    if (this.hasPrevious) {
      this.currentIndex--;
      this.resetView();
    }
  }

  next(): void {
    if (this.hasNext) {
      this.currentIndex++;
      this.resetView();
    }
  }

  zoomIn(): void {
    if (this.zoomLevel < 300) {
      this.zoomLevel += 25;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 50) {
      this.zoomLevel -= 25;
    }
  }

  resetZoom(): void {
    this.zoomLevel = 100;
    this.imageOffsetX = 0;
    this.imageOffsetY = 0;
  }

  rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  resetView(): void {
    this.zoomLevel = 100;
    this.rotation = 0;
    this.imageOffsetX = 0;
    this.imageOffsetY = 0;
  }

  onDownload(): void {
    if (this.currentImage) {
      this.download.emit(this.currentImage);
    }
  }

  // Drag functionality for zoomed images
  onMouseDown(event: MouseEvent): void {
    if (this.zoomLevel > 100) {
      this.isDragging = true;
      this.dragStartX = event.clientX - this.imageOffsetX;
      this.dragStartY = event.clientY - this.imageOffsetY;
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.imageOffsetX = event.clientX - this.dragStartX;
      this.imageOffsetY = event.clientY - this.dragStartY;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  getImageTransform(): string {
    return `
      translate(${this.imageOffsetX}px, ${this.imageOffsetY}px) 
      scale(${this.zoomLevel / 100}) 
      rotate(${this.rotation}deg)
    `;
  }
}
