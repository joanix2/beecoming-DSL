using System.Diagnostics.CodeAnalysis;
using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class OrderTypeOutput : BaseDisplayFieldsTypeStatus, IArchivable
{
    public required Guid Id { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public List<MissionTypeListOutput> MissionTypes { get; set; } = [];
    [SetsRequiredMembers]
    public OrderTypeOutput(OrderType orderType)
    {
        Id = orderType.Id;
        ArchivedAt = orderType.ArchivedAt;
        Name = orderType.Name;
        Color = orderType.Color;
        Icon = orderType.Icon;
        MissionTypes = orderType.MissionTypes.Select(m => new MissionTypeListOutput(m)).ToList();
    }
}
public class OrderTypeListOutput : BaseDisplayFieldsTypeStatus
{
    public required Guid Id { get; set; }
    public int MissionTypesCount { get; set; } = 0;

    [SetsRequiredMembers]
    public OrderTypeListOutput(OrderType orderType)
    {
        Id = orderType.Id;
        Name = orderType.Name;
        Color = orderType.Color;
        Icon = orderType.Icon;
        MissionTypesCount = orderType.MissionTypes.Count;
    }
}

public class OrderTypeInput : BaseDisplayFieldsTypeStatus
{
    public List<MissionTypeInput> MissionTypes { get; set; } = [];

    public OrderTypeInput() { }
}