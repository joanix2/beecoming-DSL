using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class MissionOutput
{
    public Guid Id { get; set; }
    public string DisplayId { get; set; }
    public string? Name { get; set; }
    public UserOutput? TeamLeader { get; set; }
    public DateTimeOffset? DateFrom { get; set; }
    public DateTimeOffset? DateTo { get; set; }
    public string? InternalComments { get; set; }
    public string? Comments { get; set; }
    public bool IsHidden { get; set; } = false;
    public DateTimeOffset? AssignedAt { get; set; } // affectation par default
    public List<AffectationMissionXTeamLeaderOutput> AffectationMissionXTeamLeaders { get; set; } // affectations multiples
    public AddressOutput? Address { get; set; }
    public List<MissionDocumentOutput>? Documents { get; set; }
    public List<FileInfoResponse>? Photos { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public MissionStatusOutput? Status { get; set; }
    public MissionTypeOutput? Type { get; set; }
    public ClientOutput Client { get; set; }
    public Guid? OrderId { get; set; }
    public List<CustomFormWithSavedDataOutput> CustomFormResponses { get; set; } = new();

    public MissionOutput(
        Mission mission
    )
    {
        Id = mission.Id;
        DisplayId = mission.DisplayId;
        Name = mission.Name;
        DateFrom = mission.DateFrom;
        DateTo = mission.DateTo;
        InternalComments = mission.InternalComments;
        Comments = mission.Comments;
        IsHidden = mission.IsHidden;
        ArchivedAt = mission.ArchivedAt;
        Type = mission.Type != null ? new MissionTypeOutput(mission.Type) : null;
        Status = mission.Status != null ? new MissionStatusOutput(mission.Status) : null;
        Client = mission.Order?.Client != null ? new ClientOutput(mission.Order.Client) : null;
        OrderId = mission.OrderId;

        // affectations teamleaders
        if(mission.AffectatedMissionXTeamLeaders is not null)
        {
            AffectationMissionXTeamLeaders = mission.AffectatedMissionXTeamLeaders.Select(aff => new AffectationMissionXTeamLeaderOutput(aff)).ToList();
        }

        if(mission.Address is not null)
        {
            Address = new AddressOutput(mission.Address);
        }



        TeamLeader = mission.MainTeamLeader is not null
            ? new UserOutput(mission.MainTeamLeader)
            : null;

        // Initialiser les CustomFormResponses avec structure + données sauvegardées
        CustomFormResponses =
            mission
                .CustomFormResponses?.Select(cfr => new CustomFormWithSavedDataOutput(
                    cfr.CustomForm,
                    cfr,
                    null
                ))
                .ToList() ?? new List<CustomFormWithSavedDataOutput>();

        // Initialiser les Documents et Photos
        Documents = mission
            .MissionDocuments?.Select(doc => new MissionDocumentOutput(doc))
            .ToList();
        Photos = mission
            .MissionPhotos?.Select(photo => new FileInfoResponse
            {
                Name = photo.FileName,
                Url = photo.Url,
            })
            .ToList();
    }

    public MissionOutput(
        Mission mission,
        AffectationMissionXTeamLeader? affectationMissionXTeamLeader
    )
    {
        Id = mission.Id;
        DisplayId = mission.DisplayId;
        Name = mission.Name;
        DateFrom = mission.DateFrom;
        DateTo = mission.DateTo;
        InternalComments = mission.InternalComments;
        Comments = mission.Comments;
        IsHidden = mission.IsHidden;
        ArchivedAt = mission.ArchivedAt;
        AssignedAt = affectationMissionXTeamLeader?.AssignedAt ?? null;
        TeamLeader = mission.MainTeamLeader is not null
            ? new UserOutput(mission.MainTeamLeader)
            : null;

        if (mission.Address is not null)
        {
            Address = new AddressOutput(mission.Address);
        }
        if (mission.Order is not null && mission.Order.Client is not null)
        {
            Client = new ClientOutput(mission.Order.Client);
        }
        if (mission.Status is not null)
        {
            Status = new MissionStatusOutput(mission.Status);
        }
        if (mission.Type is not null)
        {
            Type = new MissionTypeOutput(mission.Type);
        }
    }

    public MissionOutput(
        Mission mission,
        List<AffectationMissionXTeamLeader> affectationMissionXTeamLeaders
    )
    {
        Id = mission.Id;
        DisplayId = mission.DisplayId;
        Name = mission.Name;
        DateFrom = mission.DateFrom;
        DateTo = mission.DateTo;
        InternalComments = mission.InternalComments;
        Comments = mission.Comments;
        IsHidden = mission.IsHidden;
        ArchivedAt = mission.ArchivedAt;
        TeamLeader = mission.MainTeamLeader is not null
            ? new UserOutput(mission.MainTeamLeader)
            : null;

        AffectationMissionXTeamLeaders =
            affectationMissionXTeamLeaders
                ?.Select(aff => new AffectationMissionXTeamLeaderOutput(aff))
                .ToList() ?? [];

        if (mission.Address is not null)
        {
            Address = new AddressOutput(mission.Address);
        }
        if (mission.Order is not null && mission.Order.Client is not null)
        {
            Client = new ClientOutput(mission.Order.Client);
        }
        if (mission.Status is not null)
        {
            Status = new MissionStatusOutput(mission.Status);
        }
        if (mission.Type is not null)
        {
            Type = new MissionTypeOutput(mission.Type);
        }
    }
}

public class MissionDocumentOutput
{
    public Guid Id { get; set; }
    public Guid MissionId { get; set; }
    public string? FileName { get; set; }
    public string Url { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public MissionDocumentType Type { get; set; }

    public MissionDocumentOutput(MissionDocument document)
    {
        Id = document.Id;
        MissionId = document.MissionId;
        FileName = document.FileName;
        Url = document.Url;
        Type = document.Type;
        CreatedAt = document.CreatedAt;
    }
}

public class MissionInfoOutput
{
    public Guid Id { get; set; }
    public Guid StatusId { get; set; }

    public MissionInfoOutput(Mission mission)
    {
        Id = mission.Id;
        StatusId = mission.StatusId;
    }
}

public class MissionListOutput
{
    public Guid Id { get; set; }
    public string DisplayId { get; set; }
    public string? Name { get; set; }
    public MissionStatusOutput? Status { get; set; }
    public MissionTypeOutput? Type { get; set; }
    public ClientOutput? Client { get; set; }

    //public OrderOutput? Order { get; set; }
    public DateTimeOffset? DateFrom { get; set; }
    public DateTimeOffset? DateTo { get; set; }
    public UserOutput? TeamLeader { get; set; }
    public AddressOutput? Address { get; set; }

    public MissionListOutput() { }

    [SetsRequiredMembers]
    public MissionListOutput(Mission mission)
    {
        Id = mission.Id;
        DisplayId = mission.DisplayId;
        Name = mission.Name;
        Status = mission.Status != null ? new MissionStatusOutput(mission.Status) : null;
        Type = mission.Type != null ? new MissionTypeOutput(mission.Type) : null;
        Client = mission.Order?.Client != null ? new ClientOutput(mission.Order.Client) : null;
        //Order = mission.Order != null ? new OrderOutput(mission.Order) : null;
        DateFrom = mission.DateFrom;
        DateTo = mission.DateTo;
        //TeamLeader = mission.TeamLeader != null ? new UserOutput(mission.TeamLeader) : null;
        Address = mission.Address != null ? new AddressOutput(mission.Address) : null;
    }
}

public class MissionInput
{
    [Required(ErrorMessage = "Le nom de la mission est requis.")]
    public required string Name { get; set; }

    [Required(ErrorMessage = "Le type de mission est requis.")]
    public required Guid TypeId { get; set; }

    [Required(ErrorMessage = "Le statut de la mission est requis.")]
    public required Guid StatusId { get; set; }

    [JsonPropertyName("orderId")]
    public Guid? OrderId { get; set; } = null;

    //[Required(ErrorMessage = "Le responsable d'équipe est requis.")]
    public Guid? TeamLeaderId { get; set; }

    [Required(ErrorMessage = "La date de début est requise.")]
    public DateTimeOffset DateFrom { get; set; }

    [Required(ErrorMessage = "La date de fin est requise.")]
    public DateTimeOffset DateTo { get; set; }

    public string? InternalComments { get; set; }
    public string? Comments { get; set; }
    public AddressInput? Address { get; set; }
    public List<FileUrlResponse>? Documents { get; set; }
    public List<FileUrlResponse>? Photos { get; set; }
    public List<CustomFormResponseInput>? CustomFormResponses { get; set; }

    public MissionInput() { }
}

public class MissionVisibilityDTO
{
    [Required]
    public Guid MissionId { get; set; }

    [Required]
    public bool IsHidden { get; set; }
}

public class MissionAffectationVisibilityDTO
{
    [Required]
    public Guid MissionAffectationId { get; set; }

    [Required]
    public bool IsHidden { get; set; }
}

public class AffectationMissionXTeamLeaderOutput
{
    public Guid Id { get; set; }
    public Guid MissionId { get; set; }
    public Guid? TeamLeaderId { get; set; }
    public DateTimeOffset AssignedAt { get; set; }
    public bool IsHidden { get; set; } = false;
    public short OrderIndex { get; set; }
    public UserOutput? TeamLeader { get; set; }

    public AffectationMissionXTeamLeaderOutput(AffectationMissionXTeamLeader affect)
    {
        MissionId = affect.MissionId;
        TeamLeaderId = affect.TeamLeaderId;
        IsHidden = affect.IsHidden;
        OrderIndex = affect.OrderIndex;
        AssignedAt = affect.AssignedAt;
        Id = affect.Id;
        TeamLeader =  affect.TeamLeader is not null ? new UserOutput(affect.TeamLeader) : null;
    }
}
