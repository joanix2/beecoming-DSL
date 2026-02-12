import { Injectable, signal } from '@angular/core';
import { FilterParams } from '../../../components/datagrid/datagrid.component';
import { MissionOutput } from '../../../api/models';

@Injectable({
  providedIn: 'root',
})
export class CommandeMissionService {
  fetchParamsSignal = signal<FilterParams>({});
  isMapViewSignal = signal<boolean>(false);
  duplicatedMissionSignal = signal<MissionOutput | null>(null);
  constructor() {}
}
