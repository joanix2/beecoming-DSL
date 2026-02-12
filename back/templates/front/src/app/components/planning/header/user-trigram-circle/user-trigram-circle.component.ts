import { Component, Input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { UserTagOutput } from '../../../../api/models';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-trigram-circle',
  imports: [NgStyle, NgClass, RouterLink, MatTooltip],
  styleUrls: ['./user-trigram.scss'],
  templateUrl: './user-trigram-circle.component.html',
})
export class UserTrigramCircleComponent {
  @Input({ required: true }) user!: UserTagOutput;
  @Input() isSelected: boolean = true;
  isDragging = false;

  onDragStart() {
    this.isDragging = true;
  }

  onDragEnd() {
    this.isDragging = false;
  }
}
