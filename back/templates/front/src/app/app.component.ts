import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiConfiguration } from './api/api-configuration';
import { API_URL } from '../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'opteeam-v2-front';

  constructor(
    private readonly matIconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly apiConfig: ApiConfiguration,
  ) {
    apiConfig.rootUrl = API_URL;
    this.matIconRegistry.addSvgIconResolver((name: string) =>
      this.sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${name}.svg`),
    );
  }
}
