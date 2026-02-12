// src/app/pipes/weekday-day-month.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'weekdayDayMonth' })
export class WeekdayDayMonthPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    if (!value) return '';
    const date = new Date(value);
    // Tableau des jours et mois en français
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]}`;
  }
}
