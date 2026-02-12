import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MissionsService } from '../../api/services';
import { HeaderListComponent } from '../../components/header-list/header-list.component';
import { AppService } from '../../services/app.service';
import { TranslationService } from '../../services/translation/translation.service';
import { MissionsListComponent } from './missions/missions-list/missions-list.component';
import { OrdersListComponent } from './orders/orders-list/orders-list.component';
import { CommandeMissionService } from './service/commande-mission.service';

@Component({
  selector: 'app-orders-missions',
  templateUrl: './orders-missions.component.html',
  standalone: true,
  imports: [OrdersListComponent, MissionsListComponent, HeaderListComponent],
})
export class OrdersMissionsComponent implements OnInit {
  // injections
  missionsService = inject(MissionsService);
  commandeMissionService = inject(CommandeMissionService);
  tr = inject(TranslationService);
  route = inject(ActivatedRoute);
  appService = inject(AppService);

  // reference missionslist et orderslist
  missionsList = viewChild<MissionsListComponent>('missionsList');
  ordersList = viewChild<OrdersListComponent>('ordersList');

  // signals
  searchPlaceholderInput = signal<string>(this.tr.language().ORDER_SEARCH_PLACEHOLDER);
  fetchParamsSignal = this.commandeMissionService.fetchParamsSignal;
  isMissionSignal = signal<boolean>(false);

  // computed signals
  createButtonText = computed(() => {
    return this.isMissionSignal() ? this.tr.language().NEW_MISSION : this.tr.language().NEW_ORDER;
  });

  ngOnInit() {
    const isMission = this.route.snapshot.data['isMission'] === true;
    this.isMissionSignal.set(isMission);
    this.searchPlaceholderInput.set(
      isMission ? this.tr.language().MISSION_SEARCH_PLACEHOLDER : this.tr.language().ORDER_SEARCH_PLACEHOLDER,
    );
  }

  async gotoCreateNew() {
    if (this.isMissionSignal()) {
      await this.appService.goTo(['missions', 'new']);
    } else {
      await this.appService.goTo(['orders', 'new']);
    }
  }

  switchOrderMission($event: boolean) {
    this.isMissionSignal.set($event);
    this.searchPlaceholderInput.set(
      $event ? this.tr.language().MISSION_SEARCH_PLACEHOLDER : this.tr.language().ORDER_SEARCH_PLACEHOLDER,
    );
    if ($event) {
      this.appService.goTo(['missions']);
    } else {
      this.appService.goTo(['orders']);
    }
  }

  onSearchInput($event: string) {
    // reset pagination
    this.missionsList()?.datagrid()?.agGrid.api?.paginationGoToFirstPage();
    this.ordersList()?.datagrid()?.agGrid.api?.paginationGoToFirstPage();
    this.ordersList()?.datagrid()?.paginator.firstPage();
    this.missionsList()?.datagrid()?.paginator.firstPage();

    // cas où l'on efface la recherche, il faut supprimer le paramètre $search sinon  throw error back-end.
    if ($event === '') {
      const params = this.fetchParamsSignal();
      delete params.$search;
      this.fetchParamsSignal.update((params) => ({
        ...params,
      }));
    } else {
      this.fetchParamsSignal.update((params) => ({
        ...params,
        $search: $event ?? null,
      }));
    }
  }
}
