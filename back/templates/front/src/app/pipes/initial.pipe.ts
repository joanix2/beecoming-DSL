import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fullNameInitial',
  standalone: true,
})
export class FullNameInitialPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string' && value.length > 0) {
      const parts = value.split(' ');
      const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('.');
      return initials;
    }
    return null;
  }
}
