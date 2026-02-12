import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, OnInit, Output, output, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute } from '@angular/router';
import { NgxEditorModule } from 'ngx-editor';
import { CanDeactivateGuard } from '../../guards/can-deactivate.guard';
import { TranslationService } from '../../services/translation/translation.service';

@Component({
  standalone: true,
  selector: 'app-detail-topbar',
  templateUrl: 'detail-topbar.component.html',
  styleUrls: ['detail-topbar.component.scss'],
  imports: [CommonModule, FormsModule, NgxEditorModule, ReactiveFormsModule, MatDividerModule, MatButtonModule],
})
export class DetailTopbarComponent implements OnInit {
  @Input() title: string | undefined = '';
  @Input() editMode: WritableSignal<boolean> = signal<boolean>(false);
  @Input() submitDisabled: WritableSignal<boolean> = signal<boolean>(false);
  @Input() canDeactivate: () => boolean = () => true;
  @Input() canEdit: boolean = true;
  @Input() showBackButton = true;
  @Input() isArchived: boolean | null = null;
  @Input() showArchiveButton = true;

  @Output() archiveOrUnarchive = new EventEmitter();
  @Output() submit = new EventEmitter();
  @Output() back = new EventEmitter();
  @Output() cancel = new EventEmitter();

  onEditModeChange = output<boolean>();
  isSmallScreen: boolean = false;

  constructor(
    private readonly canDeactivateGuard: CanDeactivateGuard,
    private readonly breakpointObserver: BreakpointObserver,
    public readonly translateService: TranslationService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe((state: BreakpointState) => {
      this.isSmallScreen = state.matches;
    });
  }

  onBack() {
    this.back.emit();
  }

  onSubmit() {
    this.submit.emit();
  }

  async onCancel() {
    const canDeactivate = await this.canDeactivateGuard.canDeactivate(this);
    if (canDeactivate) {
      this.cancel.emit();
    }
    if (this.route.snapshot.url.some((url) => url.path === 'new')) {
      this.onBack();
    } else {
      this.editMode.set(false);
      this.onEditModeChange.emit(false);
    }
  }

  onEdit() {
    this.editMode.set(true);
    this.onEditModeChange.emit(true);
  }

  async onArchiveOrUnarchive() {
    this.archiveOrUnarchive.emit();
  }
}
