import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { MissionDatagridPost$Params } from '../../../api/fn/mission/mission-datagrid-post';
import { MissionOutput } from '../../../api/models';
import { MissionsService } from '../../../api/services/missions.service';
import { AppService } from '../../../services/app.service';
import { TranslationService } from '../../../services/translation/translation.service';
import { ChipComponent } from '../chip/chip.component';
import { IconCellComponent } from '../icon-cell/icon-cell.component';

/**
 * Interface pour la configuration du RowDetailRendererComponent
 */
export interface RowDetailRendererConfig {
  dataKey?: string;
  checkType?: 'array' | 'number' | 'boolean';
  threshold?: number;
  loadDataFunction?: (id: string) => Promise<any>;
  childrenKey?: string;
  context?: any;
  displayColumns?: RowDetailDisplayColumn[];
  clickAction?: (event: MouseEvent, item: any) => void;
  navigationRoute?: string[];
  navigationIdKey?: string;
}

/**
 * Interface pour définir les colonnes à afficher dans les détails
 */
export interface RowDetailDisplayColumn {
  key: string;
  type?: 'text' | 'date' | 'chip' | 'custom' | 'color' | 'icon';
  colorKey?: string;
  customTemplate?: (value: any, item: any) => string;
  columnHeader?: string;
}

/**
 * RowDetailRendererComponent - Composant générique pour afficher des détails déroulants dans une grille
 *
 * Ce composant peut être utilisé avec différents types de données en configurant les cellRendererParams :
 *
 * Configuration via cellRendererParams:
 * - dataKey: string - Le nom de la propriété à vérifier pour déterminer s'il y a des données (défaut: 'missionsInfos')
 * - checkType: 'array' | 'number' | 'boolean' - Le type de vérification à effectuer (défaut: 'array')
 * - threshold: number - Le seuil pour déterminer s'il y a des données (défaut: 0)
 * - loadDataFunction: (id: string) => Promise<any> - Fonction personnalisée pour charger les données
 * - displayColumns: RowDetailDisplayColumn[] - Configuration des colonnes à afficher
 * - navigationRoute: string[] - Route de navigation automatique (ex: ['admin', 'users'])
 * - navigationIdKey: string - Clé pour récupérer l'ID de navigation (défaut: 'id')
 * - clickAction: (event: MouseEvent, item: any) => void - Action personnalisée lors du clic (optionnel)
 *
 * Exemples d'utilisation:
 *
 * 1. Navigation automatique vers les détails d'un type de mission:
 * ```typescript
 * cellRendererParams: {
 *   dataKey: 'missionTypesCount',
 *   checkType: 'number',
 *   threshold: 0,
 *   loadDataFunction: async (id: string) => {
 *     return await this.getRelatedMissionTypes(id);
 *   },
 *   displayColumns: [
 *     { key: 'name', type: 'text' },
 *     { key: 'color', type: 'chip', colorKey: 'color' }
 *   ],
 *   navigationRoute: ['administration', 'mission-types'],
 *   navigationIdKey: 'id'
 * } as RowDetailRendererConfig
 * ```
 *
 * 2. Navigation vers une page utilisateur:
 * ```typescript
 * cellRendererParams: {
 *   dataKey: 'usersCount',
 *   checkType: 'number',
 *   navigationRoute: ['admin', 'users'],
 *   navigationIdKey: 'userId'
 * } as RowDetailRendererConfig
 * ```
 *
 * 3. Action personnalisée (pour les cas complexes):
 * ```typescript
 * cellRendererParams: {
 *   dataKey: 'itemsCount',
 *   clickAction: (event: MouseEvent, item: any) => {
 *     this.handleComplexAction(item);
 *   }
 * } as RowDetailRendererConfig
 * ```
 */
@Component({
  selector: 'app-custom-detail-renderer',
  templateUrl: 'row-detail-renderer.component.html',
  styleUrls: ['./row-detail.scss'],
  imports: [CommonModule, MatIconModule, MatTooltip, ChipComponent, IconCellComponent],
})
export class RowDetailRendererComponent implements ICellRendererAngularComp {
  missionsService = inject(MissionsService);
  appService = inject(AppService);
  http = inject(HttpClient);
  params!: ICellRendererParams;
  gotData = signal(false);
  loadDataAction!: () => void;
  data!: any;
  rowDetailSignal = signal<string | null>(null);
  iconComputed = computed<string>(() => {
    return 'chevron_down';
  });
  children: any[] = [];
  defaultRowHeight = 40;
  isClosed = signal(true);

  constructor(protected translateService: TranslationService) {
    effect(() => {
      const closed = this.isClosed();
      this.setColumnHeight(closed);
    });
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.defaultRowHeight = params.node.rowHeight ?? 40;
    this.rowDetailSignal.set(this.params.data.id);
    this.data = this.params.node.data;

    // Configuration via cellRendererParams avec typage
    const config: RowDetailRendererConfig = this.params.colDef?.cellRendererParams || {};
    const dataKey = config.dataKey || 'missionsInfos';
    const threshold = config.threshold || 0;
    const checkType = config.checkType || 'array';

    // Déterminer si on a des données de manière générique
    this.gotData.set(this.hasData(this.data, dataKey, threshold, checkType));

    if (config.childrenKey) {
      this.children = this.params.data[config.childrenKey] ?? [];
    }
  }

  /**
   * Méthode générique pour vérifier si on a des données
   */
  private hasData(data: any, dataKey: string, threshold: number, checkType: string): boolean {
    const value = data[dataKey];

    switch (checkType) {
      case 'array':
        return Array.isArray(value) && value.length > threshold;
      case 'number':
        return typeof value === 'number' && value > threshold;
      case 'boolean':
        return Boolean(value);
      default:
        return Boolean(value);
    }
  }

  setColumnHeight(isClosed: boolean) {
    if (!isClosed) {
      // Calculer la hauteur nécessaire : ligne de base + (nombre d'enfants × 46px)
      const baseHeight = this.defaultRowHeight; // Ligne principale
      const childrenHeight = this.children.length * 46; // 46px par enfant (même hauteur qu'une ligne de datagrid)
      const totalHeight = baseHeight + childrenHeight;

      this.params.node.setRowHeight(totalHeight);
    } else {
      this.params.node.setRowHeight(this.defaultRowHeight);
    }
    this.params.api.onRowHeightChanged();
    this.params.api.sizeColumnsToFit();
  }

  async loadData() {
    const config: RowDetailRendererConfig = this.params.colDef?.cellRendererParams || {};

    // Si une fonction de chargement personnalisée est fournie, l'utiliser
    if (config.loadDataFunction && typeof config.loadDataFunction === 'function') {
      try {
        const result = await config.loadDataFunction(this.data.id);
        this.children = Array.isArray(result) ? result : result?.value || [];
      } catch (error) {
        console.error('Error loading custom data:', error);
        this.children = [];
      }
    } else {
      // Comportement par défaut pour les missions
      const filters: MissionDatagridPost$Params = {
        orderId: this.data.id,
      };

      try {
        const missions = await firstValueFrom(this.missionsService.missionsDatagridGet(filters));
        this.children = missions.value as MissionOutput[];
      } catch (error) {
        console.error('Error loading missions:', error);
        this.children = [];
      }
    }

    this.setColumnHeight(this.isClosed());
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  toggleDetails(event: MouseEvent | Event) {
    event.stopPropagation();

    if (this.isClosed()) {
      this.isClosed.set(false);
      this.loadData();
    } else {
      this.isClosed.set(true);
      this.rowDetailSignal.set(null);
    }
  }

  getWidth(width: number, index: number): string {
    if (index == 0 || index == (this.params.api.getColumns()?.length ?? 0) - 1) {
      return `${width - 15}px`;
    }

    return `${width}px`;
  }

  getClass(colDef: ColDef, data: any): any {
    if (!colDef.field) return;

    const column = this.params.api.getColumn(colDef.field);
    let filedData = data[colDef.field];

    if (!column) return;

    if (typeof colDef.valueGetter === 'function') {
      filedData = colDef.valueGetter({
        data: data,
        getValue: (key: string) => data[key],
        column,
        colDef: colDef,
        api: this.params.api,
        context: this.params.context,
        node: null,
      });
    }

    if (typeof colDef.cellClass === 'function') {
      return colDef.cellClass({
        data: data,
        rowIndex: 0,
        colDef: colDef,
        api: this.params.api,
        context: this.params.context,
        column: column,
        value: filedData,
        node: {} as any,
      });
    }
  }

  goToMission(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.appService.goTo(['missions', id]);
  }

  /**
   * Récupère les colonnes d'affichage configurées
   */
  getDisplayColumns(): RowDetailDisplayColumn[] {
    const config: RowDetailRendererConfig = this.params.colDef?.cellRendererParams || {};
    return config.displayColumns || [];
  }

  /**
   * Gère le clic sur un élément
   */
  handleItemClick(event: MouseEvent, item: any): void {
    const config: RowDetailRendererConfig = this.params.colDef?.cellRendererParams || {};

    // Si une action personnalisée est définie, l'utiliser
    if (config.clickAction) {
      config.clickAction(event, item);
      return;
    }

    // Si une route de navigation est configurée, naviguer automatiquement
    if (config.navigationRoute && config.navigationRoute.length > 0) {
      event.stopPropagation();

      const idKey = config.navigationIdKey || 'id';
      const itemId = this.getNestedValue(item, idKey);

      if (itemId) {
        const route = [...config.navigationRoute, itemId];
        this.appService.goTo(route);
      } else {
        console.warn('⚠️ ID non trouvé pour la navigation. Clé utilisée:', idKey, 'Objet:', item);
      }
      return;
    }

    // Comportement par défaut pour les missions (rétrocompatibilité)
    this.goToMission(event, item.id);
  }

  /**
   * Récupère une valeur depuis un objet avec support des propriétés imbriquées
   * Ex: getNestedValue(obj, 'status.name') retourne obj.status.name
   */
  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return '';

    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Trouve la configuration de displayColumn correspondante à un field de colonne
   */
  getDisplayColumnForField(field: string | undefined): RowDetailDisplayColumn | null {
    if (!field) return null;

    const displayColumns = this.getDisplayColumns();
    return displayColumns.find((col) => col.key === field) || null;
  }

  /**
   * Calcule la largeur des colonnes pour les displayColumns
   */
  getColumnWidth(index: number): string {
    const displayColumns = this.getDisplayColumns();
    if (displayColumns.length === 0) return 'auto';

    // Répartir la largeur équitablement entre les colonnes
    const percentage = 100 / displayColumns.length;
    return `${percentage}%`;
  }

  /**
   * Retourne les colonnes vides nécessaires pour l'alignement avec la grille principale
   */
  getEmptyColumns(): Array<{ index: number; width: string }> {
    const displayColumns = this.getDisplayColumns();
    const gridColumns = this.params.api.getColumns();

    if (!gridColumns || gridColumns.length === 0) return [];

    const emptyColumns: Array<{ index: number; width: string }> = [];
    const displayColumnsCount = displayColumns.length;
    const gridColumnsCount = gridColumns.length;

    // Si on a moins de displayColumns que de colonnes dans la grille
    if (displayColumnsCount < gridColumnsCount) {
      const missingCount = gridColumnsCount - displayColumnsCount;

      // Ajouter les colonnes manquantes
      for (let i = 0; i < missingCount; i++) {
        const columnIndex = displayColumnsCount + i;
        const gridColumn = gridColumns[columnIndex];

        if (gridColumn) {
          emptyColumns.push({
            index: columnIndex,
            width: this.getWidth(gridColumn.getActualWidth(), columnIndex),
          });
        }
      }
    }

    return emptyColumns;
  }
}
