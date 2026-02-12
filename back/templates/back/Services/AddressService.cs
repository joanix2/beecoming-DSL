using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Utils;

namespace opteeam_api.Services
{
    public class AddressService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly HttpClient _httpClient;

        public AddressService(ApplicationDbContext dbContext, HttpClient httpClient)
        {
            _dbContext = dbContext;
            _httpClient = httpClient;
        }

        public async Task<Address> CreateOrUpdateAddressAsync(AddressInput input)
        {
            if (input == null)
                throw new ArgumentNullException(nameof(input));

            // Etape 1 - Chercher une adresse existante par Id (si fourni)
            Address? existingAddress = null;

            if (input.Id.HasValue)
            {
                existingAddress = await _dbContext.Addresses
                    .AsTracking()
                    .FirstOrDefaultAsync(a => a.Id == input.Id.Value);
            }

            // Etape 2 - Si non trouvee, chercher par les champs cles uniques
            if (existingAddress == null)
            {
                existingAddress = await _dbContext.Addresses
                    .AsTracking()
                    .FirstOrDefaultAsync(a =>
                        a.Street == input.Street &&
                        a.PostalCode == input.PostalCode &&
                        a.City == input.City &&
                        a.AdditionalInfo == input.AdditionalInfo);
            }

            // Etape 3 - Creer ou mettre a jour
            if (existingAddress == null)
            {
                var newAddress = new Address(input);
                _dbContext.Addresses.Add(newAddress);
                await _dbContext.SaveChangesAsync();
                return newAddress;
            }

            if (!AreAddressesEqual(existingAddress, input))
            {
                existingAddress.Update(input);
                await _dbContext.SaveChangesAsync();
            }

            return existingAddress;
        }

        private static bool AreAddressesEqual(Address address, AddressInput input)
        {
            return address.Street == input.Street &&
                   address.AdditionalInfo == input.AdditionalInfo &&
                   address.PostalCode == input.PostalCode &&
                   address.City == input.City &&
                   address.Country == input.Country &&
                   Nullable.Equals(address.Latitude, input.Latitude) &&
                   Nullable.Equals(address.Longitude, input.Longitude);
        }

        public async Task<CoordinatesMinimal?> GetCoordinatesAsync(AddressInput address)
        {
            var _apiKey = EnvironmentVariables.GEOAPIFY_KEY;
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                throw new InvalidOperationException("Geoapify API key is not configured.");

            }
            if(address is null)
            {
                throw new ArgumentNullException(nameof(address), "Address cannot be null.");
            }

            var addressString = $"{address.Street}, {address.PostalCode} {address.City}, {address.Country}";

            var url = $"https://api.geoapify.com/v1/geocode/search?text={Uri.EscapeDataString(addressString)}&apiKey={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<GeoapifyResponse>(content);

            var feature = data?.features?.FirstOrDefault();
            if (feature != null)
            {
                return new CoordinatesMinimal
                {
                    Latitude = feature.geometry.coordinates[1],
                    Longitude = feature.geometry.coordinates[0]
                }; // lat, lon
            }

            return null;
        }
    }
}
