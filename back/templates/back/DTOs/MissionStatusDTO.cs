using opteeam_api.Models;
using System.Diagnostics.CodeAnalysis;

namespace opteeam_api.DTOs;

public class MissionStatusOutput : BaseDisplayFieldsTypeStatus
{
    public Guid Id { get; set; }

    [SetsRequiredMembers]
    public MissionStatusOutput(MissionStatus model)
    {
        Id = model.Id;
        Name = model.Name;
        Color = model.Color;
        Icon = model.Icon;
        Position = model.Position;
    }
}

public class MissionStatusInput : BaseDisplayFieldsTypeStatus
{
}