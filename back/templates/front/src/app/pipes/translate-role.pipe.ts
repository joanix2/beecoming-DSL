import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation/translation.service';
import { ROLE } from '../../utils/constant';

@Pipe({
  name: 'translateRole',
  standalone: true,
})
export class TranslateRolePipe implements PipeTransform {
  tr = inject(TranslationService);
  transform(value: unknown, ...args: unknown[]): string {
    if (value === null || value === undefined) return '';

    switch (value) {
      case ROLE.SUPERVISOR:
        return this.tr.get('SUPERVISOR');
      case ROLE.TEAMLEADER:
        return this.tr.get('TEAMLEADER');
      case ROLE.OPERATOR:
        return this.tr.get('OPERATOR');
      default:
        return value as string;
    }
  }
}
