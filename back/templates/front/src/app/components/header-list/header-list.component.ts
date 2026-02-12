import { Component, DestroyRef, inject, input, model, OnInit, output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { AppService } from '../../services/app.service';
import { TranslationService } from '../../services/translation/translation.service';
import { SwitchButtonComponent } from '../fields/switch-button/switch-button.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommandeMissionService } from '../../pages/orders-missions/service/commande-mission.service';

@Component({
  selector: 'app-header-list',
  templateUrl: './header-list.component.html',
  styleUrls: ['./header-list.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    SwitchButtonComponent,
  ],
})
export class HeaderListComponent implements OnInit {
  tr = inject(TranslationService);
  appService = inject(AppService);
  commandeMissionService = inject(CommandeMissionService);
  destroyRef = inject(DestroyRef);

  // search label  & search signals
  searchTitle = input.required<string>();
  searchPlaceholderInput = input<string>(this.tr.language().SEARCH_HERE);
  showSwitch = input<boolean>(false);
  showMapView = input<boolean>(false);
  textButton = input<string>('');

  // debouncer for search input
  searchWordControl = new FormControl<string>('');
  searchSubjectWithDebounce = this.searchWordControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef),
  );

  // toggle button signals
  isChecked = model<boolean>(false);

  // output signals
  onToggleChange = output<boolean>();
  onCreateClick = output<void>();
  onInputChange = output<string>();

  constructor() {}
  ngOnInit(): void {
    this.searchSubjectWithDebounce.subscribe((value) => {
      this.onInputChange.emit(value ?? '');
    });
  }

  onCreate() {
    this.onCreateClick.emit();
  }

  onCarteView() {
    this.commandeMissionService.isMapViewSignal.set(!this.commandeMissionService.isMapViewSignal());
  }

  onSwitchChange(event: boolean) {
    this.onToggleChange.emit(event);
  }
}
