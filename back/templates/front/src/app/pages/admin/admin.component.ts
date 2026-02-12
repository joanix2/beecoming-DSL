import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyIdentityComponent } from '../../components/admin/company-identity/company-identity.component';
import { CustomizationComponent } from '../../components/admin/customization/customization.component';
import { PreferencesComponent } from '../../components/admin/preferences/preferences.component';
import { MissionTypesComponent } from '../../components/admin/type_management/mission-types/mission-types.component';
import { OrderTypesComponent } from '../../components/admin/type_management/order-types/order-types.component';
import { TranslationService } from '../../services/translation/translation.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class AdminComponent implements OnInit {
  // Services
  private tr = inject(TranslationService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  activeLink = signal<string>('company-identity');

  // Links
  links = [
    // {
    //   label: this.tr.language().PERSONNAL_INFORMATION,
    //   url: './personnal-information',
    //   id: 'personnal-information',
    //   component: PersonnalInformationComponent,
    // },
    {
      label: this.tr.language().COMPANY_INDENTITY,
      url: './company-identity',
      id: 'company-identity',
      component: CompanyIdentityComponent,
    },
    {
      label: this.tr.language().CUSTOMAZITION,
      url: './customization',
      id: 'customization',
      component: CustomizationComponent,
    },
    { label: this.tr.language().PREFERENCES, url: './preferences', id: 'preferences', component: PreferencesComponent },
    // { label: this.tr.language().ARCHIVES, url: './archives', id: 'archives', component: ArchivesComponent },
    // {
    //   label: this.tr.language().CUSTOM_FORMS,
    //   url: './custom-forms',
    //   id: 'custom-forms',
    //   component: CustomFormsComponent,
    // },
    {
      label: this.tr.language().MISSION_TYPES,
      url: './mission-types',
      id: 'mission-types',
      component: MissionTypesComponent,
    },
    {
      label: this.tr.language().ORDERS_TYPES,
      url: './order-types',
      id: 'order-types',
      component: OrderTypesComponent,
    },
  ];

  ngOnInit() {
    // Vérifier s'il y a un fragment dans l'URL au chargement de la page
    this.activatedRoute.fragment.subscribe((fragment) => {
      if (fragment) {
        // Attendre que le DOM soit rendu avant de scroller
        setTimeout(() => {
          this.scrollTo(fragment);
        }, 100);
      }
    });
  }

  // Methods
  onLinkClick(id: string) {
    // Mettre à jour l'URL avec le fragment
    this.router.navigate([], {
      fragment: id,
      relativeTo: this.activatedRoute,
    });

    // Scroller vers l'élément
    this.scrollTo(id);
    this.activeLink.set(id);
  }

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      // Vérifier si l'élément est déjà visible
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isVisible) {
        // Utiliser 'nearest' pour ne scroller que si nécessaire
        // et 'start' pour éviter le dépassement en bas de page
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }
}
