using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using opteeam_api.DTOs;

namespace opteeam_api.Models;

public class Client : BaseModel, IArchivable
{
    public Client()
    {
    }

    public Client(ClientInput clientInput)
    {
        Id = clientInput?.Id ?? Guid.NewGuid();
        Update(clientInput);
    }

    [Required] public string Company { get; set; }
    [Required] public string ContactName { get; set; }
    [Required] public string Email { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? AddressId { get; set; }
    [ForeignKey(nameof(AddressId))] public Address? Address { get; set; }

    public ICollection<Order> Orders { get; set; }

    public DateTimeOffset? ArchivedAt { get; set; }

    public void Update(ClientInput clientInput)
    {
        Company = clientInput.Company;
        ContactName = clientInput.ContactName;
        Email = clientInput.Email;
        PhoneNumber = clientInput.PhoneNumber;
        Address = new Address(clientInput.Address);
    }
}