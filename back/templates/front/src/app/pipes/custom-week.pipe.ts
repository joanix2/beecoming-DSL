import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

@Pipe({
  name: 'customWeek',
  standalone: true,
})
export class CustomWeekPipe implements PipeTransform {
  transform(target: DateTime, start: DateTime): string {
    // first day of the week is Monday
    const startWeek = start.startOf('week');
    const targetWeek = target.startOf('week');
    const weekDiff = Math.round(targetWeek.diff(startWeek, 'weeks').weeks);

    // If target is in the same week as start
    if (weekDiff === 0) {
      return 'S';
    }

    // If target is within 3 weeks (before or after)
    if (Math.abs(weekDiff) <= 3) {
      return weekDiff > 0 ? `S+${weekDiff}` : `S${weekDiff}`;
    }

    // If target is more than 3 weeks away, show absolute week number
    return `S${target.weekNumber.toString()}`;
  }
}
