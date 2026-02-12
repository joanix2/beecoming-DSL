using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using opteeam_api.DTOs;

namespace opteeam_api.Models;

public class Order : BaseModel, IArchivable, IHasAddress, IHasType<OrderType>
{
    public Order()
    {
    }

    public Order(OrderInput orderInput)
    {
        Id = orderInput?.Id ?? Guid.NewGuid();
        Update(orderInput);
    }

    public required string Name { get; set; }
    public string? Comment { get; set; }
    public required Guid ClientId { get; set; }
    [ForeignKey(nameof(ClientId))] public Client Client { get; set; }
    public Guid StatusId { get; set; }
    [ForeignKey(nameof(StatusId))] public OrderStatus Status { get; set; }
    public string DisplayId { get; set; }
    public ICollection<Mission> Missions { get; set; }

    public string MinioFolderName => "orders";
    public DateTimeOffset? ArchivedAt { get; set; }
    public Guid AddressId { get; set; }
    [ForeignKey(nameof(AddressId))] public Address Address { get; set; }
    public required Guid TypeId { get; set; }
    [ForeignKey(nameof(TypeId))] public OrderType Type { get; set; }

    public void Update(OrderInput orderInput)
    {
        Comment = orderInput.Comment;
        Address = new Address(orderInput.Address);
    }
}

public class OrderDocument : BaseFile<OrderDocumentType>
{
    public Guid OrderId { get; set; }
    [ForeignKey(nameof(OrderId))] public Order Order { get; set; }
}

public class OrderType : BaseType, IArchivable
{
    public OrderType()
    {
    }

    [SetsRequiredMembers]
    public OrderType(OrderTypeInput orderTypeInput)
    {
        Name = orderTypeInput.Name;
        Color = orderTypeInput.Color;
        Icon = orderTypeInput.Icon;
    }

    public ICollection<MissionType> MissionTypes { get; set; } = new List<MissionType>();
    public OrderTypeOutput Output => new(this);
}

public class OrderDocumentType : BaseType
{
}

public class OrderStatus : BaseStatus
{
}