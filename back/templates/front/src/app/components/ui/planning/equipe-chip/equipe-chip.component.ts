import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-equipe-chip',
  imports: [CommonModule],
  templateUrl: './equipe-chip.component.html',
  styleUrls: ['./equipe-chip.component.scss'],
})
export class EquipeChipComponent implements OnInit {
  equipe = input<string>('ABC');
  isAbsent = input<boolean>(false);
  constructor() {}

  ngOnInit() {}
}
