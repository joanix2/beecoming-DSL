import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { APP_CONSTANTS } from '../../../../utils/constant';
import { FileInfoResponse } from '../../../api/models';
import { MissionsService } from '../../../api/services';
import { TranslationService } from '../../../services/translation/translation.service';
import { DeleteConfirmationDialogComponent } from '../../delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  selector: 'app-images-carousel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './images-carousel.component.html',
  styleUrls: ['./images-carousel.component.scss'],
})
export class ImagesCarouselComponent implements AfterViewInit, OnDestroy {
  // Services
  tr = inject(TranslationService);
  missionsService = inject(MissionsService);
  toastr = inject(ToastrService);
  dialog = inject(MatDialog);

  // Inputs
  missionId = input.required<string>();

  // Models and Signals
  imagesUrls = model<FileInfoResponse[]>([]);
  selectedIndex = signal(0);

  // Computed
  images: Signal<string[]> = computed(() => this.imagesUrls().map((image) => image.url ?? ''));
  selectedImage: Signal<string | undefined> = computed(() => this.images()[this.selectedIndex()]);

  // Constants
  acceptedMimeTypes = APP_CONSTANTS.ACCEPTED_EXTENSIONS;
  maxVolume = 10 * 1024 * 1024; // 10MB

  // ViewChild
  @ViewChild('thumbnailContainer') thumbnailContainer?: ElementRef<HTMLElement>;
  @ViewChild('mainContainer') mainContainer?: ElementRef<HTMLElement>;

  // Thumbnail scrolling state
  private readonly _canScrollLeft = signal(false);
  canScrollLeft = this._canScrollLeft.asReadonly();

  private readonly _canScrollRight = signal(false);
  canScrollRight = this._canScrollRight.asReadonly();

  private readonly visibleThumbnails = 5; // Default number of thumbnails visible, adjust as needed

  // Observers for visibility and resize detection
  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;

  constructor() {
    // Effect to load images when missionId changes
    effect(() => {
      const missionId = this.missionId();
      if (missionId && missionId !== 'new') {
        this.loadImages(missionId);
      }
    });
  }

  ngAfterViewInit() {
    this.updateScrollButtonStates();
    this.setupObservers();
  }

  ngOnDestroy() {
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  /**
   * Setup observers to detect visibility and size changes
   */
  private setupObservers(): void {
    // IntersectionObserver to detect when component becomes visible
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Component is now visible, update scroll button states
            // Use a small delay to ensure DOM is fully rendered
            setTimeout(() => this.updateScrollButtonStates(), 100);
          }
        });
      },
      { threshold: 0.1 }, // Trigger when at least 10% is visible
    );

    // Observe the main container
    if (this.mainContainer?.nativeElement) {
      this.intersectionObserver.observe(this.mainContainer.nativeElement);
    }

    // ResizeObserver to detect when thumbnail container size changes
    this.resizeObserver = new ResizeObserver(() => {
      // Debounce the resize updates
      setTimeout(() => this.updateScrollButtonStates(), 50);
    });

    // Start observing the thumbnail container once it's available
    if (this.thumbnailContainer?.nativeElement) {
      this.resizeObserver.observe(this.thumbnailContainer.nativeElement);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScrollButtonStates();
  }

  /**
   * Load images for the given mission
   */
  private async loadImages(missionId: string): Promise<void> {
    try {
      const images = await firstValueFrom(this.missionsService.missionsMissionIdPicturesGet({ missionId }));

      if (images.length > 0) {
        this.imagesUrls.set(images);
        // Reset selected index if it's out of bounds
        if (this.selectedIndex() >= images.length) {
          this.selectedIndex.set(0);
        }
      } else {
        this.imagesUrls.set([]);
        this.selectedIndex.set(0);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      this.toastr.error('Erreur lors du chargement des images');
    }
  }

  /**
   * Handle image upload
   */
  async uploadImage(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const missionId = this.missionId();
    if (!missionId) {
      this.toastr.error('ID de mission manquant');
      return;
    }

    // volume total
    const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
    if (totalSize > this.maxVolume) {
      this.toastr.error(`Le volume de la photo dépasse la limite de ${this.maxVolume / 1024 / 1024}MB`);
      return;
    }

    // extension des fichiers
    const fileExtensions = Array.from(files).map((file) => file.name.split('.').pop()?.toLowerCase());

    if (
      fileExtensions &&
      fileExtensions.length > 0 &&
      fileExtensions.some((ext) => !this.acceptedMimeTypes.includes(`.${ext}`))
    ) {
      this.toastr.error(
        `Les photos doivent être de type ${this.acceptedMimeTypes.join(', ')}, ${fileExtensions.join(', ')}`,
      );
      return;
    }

    try {
      // Upload each file
      for (const file of Array.from(files)) {
        const uploadedImage = await firstValueFrom(
          this.missionsService.missionsMissionIdPicturesPost$FormData({
            missionId,
            body: {
              file: file,
            },
          }),
        );

        // Add to images list
        this.imagesUrls.update((prev) => [...prev, uploadedImage]);
      }

      this.toastr.success('Image(s) uploadée(s) avec succès');
      this.updateScrollButtonStates();
      // Reset file input
      (event.target as HTMLInputElement).value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      this.toastr.error("Erreur lors de l'upload de l'image");
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(image: FileInfoResponse): Promise<void> {
    const imageName = image.name || 'cette image';

    // Open confirmation dialog
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        title: "Supprimer l'image",
        itemName: imageName,
      },
      width: '400px',
    });

    // Wait for user response
    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      try {
        await firstValueFrom(
          this.missionsService.missionsMissionIdPicturesFileNameDelete({
            missionId: this.missionId(),
            fileName: imageName,
          }),
        );

        // Remove from images list
        this.imagesUrls.update((prev) => prev.filter((img) => img.name !== imageName));

        // Adjust selected index if necessary
        const currentImages = this.imagesUrls();
        if (this.selectedIndex() >= currentImages.length && currentImages.length > 0) {
          this.selectedIndex.set(currentImages.length - 1);
        } else if (currentImages.length === 0) {
          this.selectedIndex.set(0);
        }

        this.toastr.success('Image supprimée avec succès');
      } catch (error) {
        console.error('Error deleting image:', error);
        this.toastr.error("Erreur lors de la suppression de l'image");
      }
    }
    this.updateScrollButtonStates();
  }

  selectImage(index: number): void {
    if (index >= 0 && index < this.imagesUrls().length) {
      this.selectedIndex.set(index);
    }
  }

  scrollThumbnails(direction: 'prev' | 'next'): void {
    if (!this.thumbnailContainer) return;

    const container = this.thumbnailContainer.nativeElement;
    const scrollAmount = (container.clientWidth / this.visibleThumbnails) * Math.floor(this.visibleThumbnails / 2); // Scroll by half the visible container width or a few thumbnails

    if (direction === 'prev') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
    // Scroll events are async, so update buttons after a short delay
    setTimeout(() => this.updateScrollButtonStates(), 300);
  }

  updateScrollButtonStates(): void {
    if (!this.thumbnailContainer) {
      this._canScrollLeft.set(false);
      this._canScrollRight.set(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = this.thumbnailContainer.nativeElement;

    // Add a small tolerance for floating point comparisons
    const tolerance = 1;

    this._canScrollLeft.set(scrollLeft > tolerance);
    this._canScrollRight.set(scrollLeft < scrollWidth - clientWidth - tolerance);
  }
}
