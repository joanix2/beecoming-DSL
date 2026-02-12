using opteeam_api.Models;
using System.Diagnostics.CodeAnalysis;

namespace opteeam_api.DTOs;

public class OrderStatusOutput : BaseDisplayFieldsTypeStatus
{
    public Guid Id { get; set; }

    [SetsRequiredMembers]
    public OrderStatusOutput(OrderStatus orderStatus)
    {
        Id = orderStatus.Id;
        Name = orderStatus.Name;
        Color = orderStatus.Color;
        Position = orderStatus.Position;
        Icon = orderStatus.Icon;
    }
}

public class OrderStatusInput : BaseDisplayFieldsTypeStatus
{
}