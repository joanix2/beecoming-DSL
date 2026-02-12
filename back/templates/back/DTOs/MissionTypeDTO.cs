using System.Diagnostics.CodeAnalysis;
using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class MissionTypeOutput : BaseDisplayFieldsTypeStatus, IArchivable
{
    public required Guid Id { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public List<CustomFormListOutput> CustomForms { get; set; } = [];

    [SetsRequiredMembers]
    public MissionTypeOutput(MissionType missionType)
    {
        Id = missionType.Id;
        ArchivedAt = missionType.ArchivedAt;    
        Name = missionType.Name;
        Color = missionType.Color;
        Icon = missionType.Icon;
        CustomForms = missionType.CustomForms.Select(c => new CustomFormListOutput(c, null)).ToList();
    }
}
public class MissionTypeCustomFormOutput
{
    public List<CustomFormOutput> CustomForms { get; set; } = [];
}
public class MissionTypeListOutput : BaseDisplayFieldsTypeStatus
{
    public required Guid Id { get; set; }
    public int CustomFormsCount { get; set; } = 0;

    [SetsRequiredMembers]
    public MissionTypeListOutput(MissionType missionType)
    {
        Id = missionType.Id;
        Name = missionType.Name;
        Color = missionType.Color;
        Icon = missionType.Icon;
        CustomFormsCount = missionType.CustomForms.Count;
    }
}

public class MissionTypeInput : BaseDisplayFieldsTypeStatus
{
    public Guid? OrderTypeId { get; set; } = null;
    public List<CustomFormInput> CustomForms { get; set; } = [];

    public MissionTypeInput() { }
}
