import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initialLetter',
  standalone: true,
})
export class InitialLetterPipe implements PipeTransform {
  transform(fullName: string | null | undefined, mode: 'first' | 'last' | 'all' = 'first'): string {
    if (!fullName) return '';

    const parts = fullName.trim().split(/\s+/);

    switch (mode) {
      case 'first':
        return parts[0][0].toUpperCase();
      case 'last':
        return parts.at(-1)![0].toUpperCase();
      case 'all':
        return parts.map((p) => p[0].toUpperCase()).join('');
      default:
        return '';
    }
  }
}
