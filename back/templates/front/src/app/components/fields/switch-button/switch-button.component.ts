import { Component, input, model, OnInit, output } from '@angular/core';
import { TranslationService } from '../../../services/translation/translation.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-switch-button',
  templateUrl: './switch-button.component.html',
  styleUrls: ['./switch-button.component.scss'],
  imports: [MatTooltipModule],
})
export class SwitchButtonComponent implements OnInit {
  isChecked = model<boolean>(false);
  leftSwitchWord = input.required<string>();
  rightSwitchWord = input.required<string>();
  tooltip = input<string>('');
  onToggleChange = output<boolean>();

  constructor(public tr: TranslationService) {}

  ngOnInit() {}

  onSwitchChange(event: boolean) {
    this.onToggleChange.emit(event);
  }
}
