using opteeam_api.DTOs;

namespace opteeam_api.Models;

public class Address : BaseModel
{
    public string Street { get; set; }
    public string PostalCode { get; set; }
    public string City { get; set; }
    public string? AdditionalInfo { get; set; }
    public string Country { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public Address() { }
    public Address(AddressInput addressInput)
    {
        Id = addressInput.Id ?? Guid.NewGuid();
        Update(addressInput);
    }
    public void Update(AddressInput addressInput)
    {
        Street = addressInput.Street;
        AdditionalInfo = addressInput.AdditionalInfo;
        PostalCode = addressInput.PostalCode;
        City = addressInput.City;
        Country = addressInput.Country;
        Latitude = addressInput.Latitude;
        Longitude = addressInput.Longitude;

    }


}