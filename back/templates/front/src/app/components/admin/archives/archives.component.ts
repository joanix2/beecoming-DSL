import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslationService } from '../../../services/translation/translation.service';

@Component({
  selector: 'app-archives',
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.scss'],
  imports: [MatIconModule, MatButtonModule],
})
export class ArchivesComponent implements OnInit {
  tr = inject(TranslationService);

  buttons = [
    {
      label: this.tr.language().ARCHIVE_CLIENT,
      onClick: () => {
        // TODO: Archive client
      },
    },
    {
      label: this.tr.language().ARCHIVE_USER,
      onClick: () => {
        // TODO: Archive user
      },
    },
    {
      label: this.tr.language().ARCHIVE_ORDER,
      onClick: () => {
        // TODO: Archive order
      },
    },
    {
      label: this.tr.language().ARCHIVE_MISSION,
      onClick: () => {
        // TODO: Archive mission
      },
    },
    {
      label: this.tr.language().ARCHIVE_TYPE,
      onClick: () => {
        // TODO: Archive type
      },
    },
  ];

  ngOnInit() {}
}
