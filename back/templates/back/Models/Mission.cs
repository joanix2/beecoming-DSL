using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using opteeam_api.DTOs;
using opteeam_api.Utils;

namespace opteeam_api.Models;

public class Mission : BaseModel, IArchivable, IHasAddress, IHasType<MissionType>, IHasStatus<MissionStatus>
{
    public Mission()
    {
    }

    [SetsRequiredMembers]
    public Mission(MissionInput missionInput, ApplicationDbContext dbContext, Address address)
    {
        DisplayId = DisplayIdGenerator.GenerateDisplayId<Mission>(dbContext);
        Name = missionInput.Name;
        TypeId = missionInput.TypeId;
        StatusId = missionInput.StatusId;
        TeamLeaderId = missionInput.TeamLeaderId;
        DateFrom = missionInput.DateFrom;
        DateTo = missionInput.DateTo;
        Comments = missionInput.Comments;
        InternalComments = missionInput.InternalComments;
        OrderId = missionInput.OrderId;
        Address = address;
    }

    [SetsRequiredMembers]
    public Mission(Mission mission, ApplicationDbContext dbContext)
    {
        DisplayId = DisplayIdGenerator.GenerateDisplayId<Mission>(dbContext);
        Name = mission.Name;
        TypeId = mission.TypeId;
        StatusId = mission.StatusId;
        //TeamLeaderId = mission.TeamLeaderId;
        DateFrom = mission.DateFrom;
        DateTo = mission.DateTo;
        Comments = mission.Comments;
        InternalComments = mission.InternalComments;
        OrderId = mission.OrderId;
        AddressId = mission.AddressId;
    }

    public required string Name { get; set; }
    public string? InternalComments { get; set; }
    public string? Comments { get; set; }
    public DateTimeOffset DateFrom { get; set; }
    public DateTimeOffset DateTo { get; set; }
    public required string DisplayId { get; set; }
    public bool IsHidden { get; set; } = false;
    public Guid? OrderId { get; set; }
    public Guid? TeamLeaderId { get; set; }
    [ForeignKey(nameof(TeamLeaderId))] public ApplicationUser? MainTeamLeader { get; set; }
    [ForeignKey(nameof(OrderId))] public Order? Order { get; set; }
    public ICollection<MissionPhoto> MissionPhotos { get; set; }
    public ICollection<MissionDocument> MissionDocuments { get; set; }
    public ICollection<CustomFormResponse> CustomFormResponses { get; set; }
    public ICollection<AffectationMissionXTeamLeader> AffectatedMissionXTeamLeaders { get; set; } = new List<AffectationMissionXTeamLeader>();

    [JsonIgnore] [NotMapped] public string MinioFolderName => "missions";
    public DateTimeOffset? ArchivedAt { get; set; }
    public Guid AddressId { get; set; }
    [ForeignKey(nameof(AddressId))] public Address Address { get; set; }
    public required Guid StatusId { get; set; }
    [ForeignKey(nameof(StatusId))] public MissionStatus? Status { get; set; }
    public required Guid TypeId { get; set; }
    [ForeignKey(nameof(TypeId))] public MissionType? Type { get; set; }
}

public class MissionPhoto : BaseFile<MissionPhotoType>
{
    public Guid MissionId { get; set; }
    [ForeignKey(nameof(MissionId))] public Mission Mission { get; set; }
}

public class MissionDocument : BaseFile<MissionDocumentType>
{
    public Guid MissionId { get; set; }
    [ForeignKey(nameof(MissionId))] public Mission Mission { get; set; }
}

public class MissionType : BaseType, IArchivable
{
    public MissionType()
    {
    }

    [SetsRequiredMembers]
    public MissionType(MissionTypeInput missionTypeInput)
    {
        OrderTypeId = missionTypeInput.OrderTypeId;
        Name = missionTypeInput.Name;
        Color = missionTypeInput.Color;
        Icon = missionTypeInput.Icon;
    }

    public Guid? OrderTypeId { get; set; }

    [ForeignKey(nameof(OrderTypeId))] public OrderType? OrderType { get; set; } = null;

    public ICollection<CustomForm> CustomForms { get; set; } = new List<CustomForm>();
    public MissionTypeOutput Output => new(this);
}

public class MissionDocumentType : BaseType
{
}

public class MissionPhotoType : BaseType
{
}

public class MissionStatus : BaseStatus
{
}