import { Component, OnDestroy } from "@angular/core";
import { IFilterAngularComp } from "ag-grid-angular";
import { IFilterParams } from "ag-grid-community";
import { MatCheckbox } from "@angular/material/checkbox";
import { NgClass, NgForOf, NgStyle } from "@angular/common";
import { TranslationService } from "../../../services/translation/translation.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { debounceTime } from "rxjs";
import { FilterParams } from "../datagrid.component";
import { MatIcon } from "@angular/material/icon";

export interface ColorCheckbox {
  label: string;
  value: string;
  color: string;
  icon?: string;
}

export interface ColorCheckboxAndCount {
  colorCheckbox: ColorCheckbox[];
  count: number;
}

interface CustomFilterParams extends IFilterParams {
  fetchFilterValues: (fetchParams: FilterParams) => Promise<ColorCheckboxAndCount>;
  displaySearchBar: boolean;
}

@Component({
  selector: "app-checkbox-filter",
  templateUrl: "./checkbox-filter.component.html",
  standalone: true,
  imports: [MatCheckbox, NgForOf, ReactiveFormsModule, NgClass, MatIcon, NgStyle],
})
export class CheckboxFilterComponent implements IFilterAngularComp, OnDestroy {
  params!: CustomFilterParams;
  selectedValues: Set<string> = new Set();

  values: ColorCheckbox[] = [];
  elementTotalCount: number = 0;
  elementFetchCount: number = 0;

  searchControl: FormControl<string | undefined> = new FormControl();
  searchControlSubscription = this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
    if (value === "") {
      value = undefined;
    }

    this.params.fetchFilterValues({ $search: value, $top: 10 }).then((statuses) => {
      this.values = statuses.colorCheckbox;
      this.elementFetchCount = statuses.count;
    });
  });

  constructor(protected readonly translateService: TranslationService) {}

  agInit(params: CustomFilterParams): void {
    this.params = params;

    this.params.fetchFilterValues({ $top: 10 }).then((statuses) => {
      this.values = statuses.colorCheckbox;
      this.elementFetchCount = this.elementTotalCount = statuses.count;
    });
  }

  ngOnDestroy() {
    this.searchControlSubscription.unsubscribe();
  }

  onCheckboxChange(event: any, status: string) {
    if (event.checked) {
      this.selectedValues.add(status);
    } else {
      this.selectedValues.delete(status);
    }
    this.params.filterChangedCallback(); // Notifie AG Grid que le filtre a changé
  }

  // Méthode appelée pour vérifier si une ligne doit être filtrée
  doesFilterPass(params: any): boolean {
    return true;
  }

  isFilterActive(): boolean {
    return this.selectedValues.size > 0;
  }

  getModel() {
    if (!this.isFilterActive()) {
      return null;
    }
    return { values: Array.from(this.selectedValues), filterType: this.params.colDef.type };
  }

  setModel(model: any) {
    if (model) {
      this.selectedValues = new Set(model.values);
    } else {
      this.selectedValues.clear();
    }
  }

  async onSelectAllChange(event: any) {
    if (event.checked) {
      if (this.params.displaySearchBar) {
        const result = await this.params.fetchFilterValues({});
        result.colorCheckbox.forEach((status) => this.selectedValues.add(status.value));
      } else {
        this.values.forEach((status) => this.selectedValues.add(status.value));
      }
    } else {
      this.selectedValues.clear();
    }
    this.params.filterChangedCallback();
  }

  areAllSelected(): boolean {
    return this.selectedValues.size !== 0 && this.selectedValues.size === this.elementTotalCount;
  }

  partiallyComplete(): boolean {
    return this.selectedValues.size > 0 && !this.areAllSelected();
  }

  async seeMore() {
    let search = this.searchControl.value || undefined;
    const result = await this.params.fetchFilterValues({
      $top: 10,
      $skip: this.values.length,
      $search: search,
    });
    this.values = [...this.values, ...result.colorCheckbox];
    this.elementFetchCount = result.count;
  }
}
