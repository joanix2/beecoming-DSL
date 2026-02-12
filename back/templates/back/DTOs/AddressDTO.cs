using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class AddressInput
{
    public Guid? Id { get; set; }
    public required string Street { get; set; }
    public string? AdditionalInfo { get; set; }
    public required string PostalCode { get; set; }
    public required string City { get; set; }
    public required string Country { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public bool IsEqualTo(Address address)
    {
        if (address == null) return false;

        return Street == address.Street &&
               AdditionalInfo == address.AdditionalInfo &&
               PostalCode == address.PostalCode &&
               City == address.City &&
               Country == address.Country &&
               Latitude == address.Latitude &&
               Longitude == address.Longitude;
    }
}
public class AddressOutput
{
    public Guid? Id { get; set; }
    public string Street { get; set; }
    public string? AdditionalInfo { get; set; }
    public string PostalCode { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public AddressOutput()
    {

    }

    public AddressOutput(Address address)
    {

        if (address == null)
            throw new ArgumentNullException(nameof(address));

        Id = address.Id;
        Street = address.Street;
        AdditionalInfo = address.AdditionalInfo;
        PostalCode = address.PostalCode;
        City = address.City;
        Country = address.Country;
        Latitude = address.Latitude;
        Longitude = address.Longitude;
    }

}