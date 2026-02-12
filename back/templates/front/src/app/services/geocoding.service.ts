import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AddressInput, AddressOutput } from '../api/models';
import { AddressesService } from '../api/services';

export interface GeocodeResult {
  address: AddressOutput;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly addressesService = inject(AddressesService);

  constructor() {}

  async localizeAddress(address: AddressOutput): Promise<GeocodeResult | null> {
    const coords = await firstValueFrom(
      this.addressesService.addressesLocalizeAddressPost({
        body: address as AddressInput,
      }),
    );
    address.latitude = coords.latitude;
    address.longitude = coords.longitude;
    return {
      address,
      latitude: address.latitude,
      longitude: address.longitude,
    } as GeocodeResult;
  }
}
