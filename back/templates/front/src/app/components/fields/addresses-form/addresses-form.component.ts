import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, forwardRef, input, signal } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AddressInput } from '../../../api/models';
import { TranslationService } from '../../../services/translation/translation.service';
import { MapViewComponent } from '../../map-view/map-view.component';
import { AbstractFieldComponent } from '../abstract-field.component';
import { AddressFieldsComponent } from './address-fields/address-fields.component';

@Component({
  selector: 'app-addresses-form',
  standalone: true,
  templateUrl: 'addresses-form.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AddressFieldsComponent,
    MapViewComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressesFormComponent),
      multi: true,
    },
  ],
})
export class AddressesFormComponent extends AbstractFieldComponent<AddressInput> {
  name = input<string>('');
  address = signal<AddressInput>({} as AddressInput);

  constructor(
    protected override readonly cdr: ChangeDetectorRef,
    protected readonly tr: TranslationService,
  ) {
    super(cdr);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.formControl.valueChanges.subscribe((value) => {
      this.address.set(value as AddressInput);
    });
  }

  get addressComputed() {
    if (this.address()) {
      return [this.address()];
    }
    return [];
  }
}
