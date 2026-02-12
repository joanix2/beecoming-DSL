using opteeam_api.Models;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace opteeam_api.DTOs;

public class ClientInput
{
    public Guid Id { get; set; }
    public required string ContactName { get; set; }
    public required string Email { get; set; }
    public required string PhoneNumber { get; set; }
    public required AddressInput Address { get; set; }
    public required string Company { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
}

public class ClientOutput
{
    public required Guid Id { get; set; }

    [Required]
    public required string? Company { get; set; }
    public required string? ContactName { get; set; }

    [Required]
    public required string Email { get; set; }

    [Required]
    public required string PhoneNumber { get; set; }

    [Required]
    public required List<Guid> GroupIds { get; set; }

    [Required]
    public required List<Guid> RoleIds { get; set; }

    [Required]
    public required AddressOutput? Address { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }

    [SetsRequiredMembers]
    public ClientOutput(Client client)
    {
        Id = client.Id;
        Company = client.Company;
        ContactName = client.ContactName;
        Email = client.Email;
        PhoneNumber = client.PhoneNumber;
        ArchivedAt = client.ArchivedAt;
        Address = client.Address != null ? new AddressOutput(client.Address) : null;
    }
}

public class ClientListOutput
{
    public required Guid Id { get; set; }

    [Required]
    public required string? Company { get; set; }
    public required string? ContactName { get; set; }

    [Required]
    public required string Email { get; set; }

    [Required]
    public required string PhoneNumber { get; set; }

    [Required]
    public DateTimeOffset? ArchivedAt { get; set; }

    [Required]
    public required string LastOrderId { get; set; }

    [SetsRequiredMembers]
    public ClientListOutput(Client client)
    {
        Company = client.Company;
        Id = client.Id;
        ContactName = client.ContactName;
        Email = client.Email;
        PhoneNumber = client.PhoneNumber;
        ArchivedAt = client.ArchivedAt;
        LastOrderId = client.Orders.OrderBy(x => x.CreatedAt).LastOrDefault()?.DisplayId;
    }
}

public class ClientAutoCompleteOutput
{
    public required Guid Id { get; set; }
    public required string Company { get; set; }

    [SetsRequiredMembers]
    public ClientAutoCompleteOutput(Client client)
    {
        Id = client.Id;
        Company = client.Company;
    }
}
