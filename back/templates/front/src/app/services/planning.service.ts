import { computed, inject, Injectable, signal, untracked } from '@angular/core';
import { DateTime } from 'luxon';
import { MissionOutput, OperatorOutput, UserOutput, UserTagOutput } from '../api/models';
import { MissionsService, UsersService } from '../api/services';
import { firstValueFrom, map } from 'rxjs';
import { AppService } from './app.service';

// matrice pour la vue hebdomadaire
type DayKey = string;
type TeamLeaderKey = string;

export interface PlanningMatrix {
  [teamLeaderId: TeamLeaderKey]: {
    [day: DayKey]: MissionOutput[];
  };
}

// extended operator type
export type OperatorExtended = OperatorOutput & {
  fullTime?: boolean;
  partTime?: boolean;
  blocked?: boolean;
  days?: DateTime[];
};

@Injectable({
  providedIn: 'root',
})
export class PlanningService {
  missionsService = inject(MissionsService);
  usersService = inject(UsersService);

  isMapView = signal(false);
  teamleaders = signal<UserTagOutput[]>([]);
  includeFinishedSignal = signal(true);
  availableOperators = signal<OperatorExtended[]>([]);
  selectedDateSignal = signal(DateTime.now().startOf('day'));
  selectedWeekSignal = signal(DateTime.now().weekNumber);
  isWeeklyViewSignal = signal(false);
  isShowWeekendSignal = signal(false); // check days of the week !!!!!!
  daysOfTheWeek = computed(() => {
    const showWeekend = this.isShowWeekendSignal();
    const date = DateTime.fromISO(this.selectedDateSignal().toISO() ?? '');
    const monDay = date.startOf('week');
    if (showWeekend) {
      return Array.from({ length: 7 }, (_, i) => monDay.plus({ days: i }));
    } else {
      return Array.from({ length: 5 }, (_, i) => monDay.plus({ days: i }));
    }
  });

  daysOfTheWeekAsStrings = computed(() => {
    const date = DateTime.fromISO(this.selectedDateSignal().toISO() ?? '');
    const monDay = date.startOf('week');
    const showWeekend = this.isShowWeekendSignal();
    if (showWeekend) {
      return Array.from({ length: 7 }, (_, i) => monDay.plus({ days: i })).map((day) => day.toJSDate().toISOString());
    } else {
      return Array.from({ length: 5 }, (_, i) => monDay.plus({ days: i })).map((day) => day.toJSDate().toISOString());
    }
  });

  today = DateTime.now();
  firstDayOfWeek = computed(() => {
    return this.selectedDateSignal().startOf('week');
  });
  lastDayOfWeek = computed(() => {
    const showWeekend = this.isShowWeekendSignal();
    if (showWeekend) {
      return this.selectedDateSignal().endOf('week').set({ millisecond: 0 });
    } else {
      return this.selectedDateSignal().endOf('week').minus({ days: 2 }).set({ millisecond: 0 });
    }
  });

  missions = signal<MissionOutput[] | undefined>(undefined);

  unaffectedDailyMissions = computed(() => {
    if (!this.isWeeklyViewSignal()) {
      return this.missions()?.filter((mission) => {
        return this.gotAffectations(mission, this.selectedDateSignal());
      });
    } else {
      return [];
    }
  });

  // got affectation for the given date
  gotAffectations(mission: MissionOutput, date: DateTime) {
    return (
      mission.affectationMissionXTeamLeaders?.length === 0 ||
      (mission.dateFrom &&
        DateTime.fromISO(mission.dateFrom) &&
        mission.affectationMissionXTeamLeaders?.every(
          (affectation) => new Date(affectation.assignedAt ?? '').toISOString() !== date.toJSDate().toISOString(),
        ))
    );
  }

  constructor() {}

  async fetchMissionsByWeek() {
    try {
      const dateWeekEnd = this.selectedDateSignal().startOf('week').plus({ weeks: 1 }).minus({ days: 1 });

      const dateFrom = this.selectedDateSignal().startOf('week').toISODate()!;
      const dateTo = dateWeekEnd.toISODate()!;

      const result = await firstValueFrom(
        this.missionsService.missionsUnaffectedGet({
          dateFrom,
          dateTo,
        }),
      );
      this.missions.set(result);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  }

  async FetchAllMissionsInInterval() {
    try {
      let dateFrom = this.isWeeklyViewSignal()
        ? this.firstDayOfWeek().toISODate()
        : (this.selectedDateSignal().toISODate() ?? undefined);
      let dateTo = this.isWeeklyViewSignal()
        ? this.lastDayOfWeek().toISODate()
        : (this.selectedDateSignal().plus({ days: 1 }).toISODate() ?? undefined);

      if (dateFrom == dateTo) {
        dateTo = this.selectedDateSignal().plus({ days: 1 }).toISODate() ?? undefined;
      }

      const result = await firstValueFrom(
        this.missionsService.missionsMissionsDetailedGet({
          dateFrom: dateFrom,
          dateTo: dateTo,
          includeFinished: this.includeFinishedSignal(),
        }),
      );
      this.missions.set(result);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  }

  async fetchTeams() {
    try {
      const teams = await firstValueFrom(
        this.usersService.usersTagsGet({
          role: 'teamleader',
          date: this.isWeeklyViewSignal()
            ? (this.firstDayOfWeek().toISODate() ?? undefined)
            : (this.selectedDateSignal().toISODate() ?? undefined),
          dateTo: this.isWeeklyViewSignal() ? (this.lastDayOfWeek().toISODate() ?? undefined) : undefined,
        }),
      );
      this.teamleaders.set(teams);
    } catch (error) {
      console.error(error);
    }
  }

  async getAvailableOperators(): Promise<void> {
    const operators: OperatorExtended[] = await firstValueFrom(
      this.usersService
        .usersOperatorsGet({
          role: 'operator',
          date: this.isWeeklyViewSignal()
            ? (this.firstDayOfWeek().toISODate() ?? undefined)
            : (this.selectedDateSignal().toISODate() ?? undefined),
          dateTo: this.isWeeklyViewSignal() ? (this.lastDayOfWeek().toISODate() ?? undefined) : undefined,
        })
        .pipe(
          map((operators) =>
            operators.map((operator) => ({
              ...operator,
              fullTime: false,
              partTime: false,
              blocked: false,
            })),
          ),
        ),
    );
    this.availableOperators.set(operators);
  }
}
