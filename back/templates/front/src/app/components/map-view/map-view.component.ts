import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { AddressOutput } from '../../api/models';
import { TranslationService } from '../../services/translation/translation.service';
import { GeocodeResult, GeocodingService } from '../../services/geocoding.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.component.html',
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private readonly http = inject(HttpClient);
  private readonly geocodingService = inject(GeocodingService);
  public readonly tr = inject(TranslationService);
  // Input signal for addresses
  addresses = input<AddressOutput[]>([]);

  // Internal signals
  private readonly geocodedAddresses = signal<GeocodeResult[]>([]);
  private readonly isLoading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);

  // Computed signals
  hasValidCoordinates = computed(() => this.geocodedAddresses().some((result) => result.latitude && result.longitude));

  validCoordinates = computed(() => this.geocodedAddresses().filter((result) => result.latitude && result.longitude));

  // Map instance
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private markersGroup: L.LayerGroup | null = null;

  constructor() {
    // Effect to handle address changes
    effect(() => {
      const currentAddresses = this.addresses();
      if (currentAddresses && currentAddresses.length > 0) {
        this.clearMap();
        this.processAddresses(currentAddresses);
      } else {
        this.clearMap();
      }
    });

    // Effect to update map when coordinates change
    effect(() => {
      const coordinates = this.validCoordinates();
      if (this.map && coordinates.length > 0) {
        this.updateMapMarkers(coordinates);
      }
    });
  }
  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    // Initialize map centered on Europe by default
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [45.3030099, -0.2330352],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Create markers group
    this.markersGroup = L.layerGroup().addTo(this.map);

    // Fix for default marker icons in Leaflet
    this.fixLeafletMarkerIcons();
  }

  private processAddresses(addresses: AddressOutput[]): void {
    this.geocodedAddresses.set(
      addresses.map((address) => ({
        address,
        latitude: address.latitude,
        longitude: address.longitude,
      })) as GeocodeResult[],
    );
  }

  private updateMapMarkers(coordinates: GeocodeResult[]): void {
    if (!this.map || !this.markersGroup) return;

    // Clear existing markers
    this.clearMarkers();

    // Add new markers
    coordinates.forEach((result) => {
      const marker = L.marker([result.latitude, result.longitude]).bindPopup(this.createPopupContent(result.address));

      this.markers.push(marker);
      this.markersGroup!.addLayer(marker);
    });

    // Fit map to show all markers
    if (coordinates.length > 0) {
      this.fitMapToMarkers(coordinates);
    }
  }

  private clearMarkers(): void {
    if (this.markersGroup) {
      this.markersGroup.clearLayers();
    }
    this.markers = [];
  }

  private clearMap(): void {
    this.clearMarkers();
    this.geocodedAddresses.set([]);
  }

  private fitMapToMarkers(coordinates: GeocodeResult[]): void {
    if (!this.map || coordinates.length === 0) return;

    if (coordinates.length === 1) {
      // Single marker - center on it
      const result = coordinates[0];
      this.map.setView([result.latitude, result.longitude], 15);
    } else {
      // Multiple markers - fit bounds
      const latLngs: L.LatLng[] = coordinates.map((result) => L.latLng(result.latitude, result.longitude));
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  private createPopupContent(address: AddressOutput): string {
    const addressStr = [address.street, address.city, address.postalCode, address.country].filter(Boolean).join(', ');

    const additionalInfo = address.additionalInfo
      ? `<div class="text-xs text-gray-600 mt-1">${address.additionalInfo}</div>`
      : '';

    return `
      <div class="text-sm max-w-xs">
        <div class="font-semibold text-gray-800">${addressStr}</div>
        ${additionalInfo}
      </div>
    `;
  }

  private fixLeafletMarkerIcons(): void {
    // Fix for Leaflet default marker icons not showing
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;
  }

  // Getter methods for template
  get isLoadingValue() {
    return this.isLoading();
  }

  get errorValue() {
    return this.error();
  }

  get hasCoordinates() {
    return this.hasValidCoordinates();
  }

  get coordinatesCount() {
    return this.validCoordinates().length;
  }

  get addressesCount() {
    return this.addresses().length;
  }

  // header region
}
