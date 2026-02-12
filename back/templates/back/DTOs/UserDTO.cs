using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class UserInput : BaseUserInput
{
    public Guid? Id { get; set; }
    public Guid? AffectedToTeamleaderId { get; set; }
}

public class AffectationTeamLeaderOperator
{
    public Guid OperatorId { get; set; }
    public Guid TeamLeaderId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public bool? IsDefault { get; set; }
}

public class UserOutput
{
    [SetsRequiredMembers]
    public UserOutput(ApplicationUser model)
    {
        Id = model.Id;
        Firstname = model.Firstname;
        Lastname = model.Lastname;
        Email = model.Email;
        Color = model.Color;
        Roles = model.UserRoles is not null
            ? model.UserRoles.Select(r => new RoleOutput
            {
                Id = r.Role.Id,
                Name = r.Role.Name ?? "",
                Color = r.Role.Color ?? "#fffff"
            }).ToList()
            : [];
        ArchivedAt = model.ArchivedAt;
    }

    public UserOutput(ApplicationUser user, ApplicationUser? affectedToTeamleader)
    {
        Id = user.Id;
        Firstname = user.Firstname;
        Lastname = user.Lastname;
        Email = user.Email;
        Color = user.Color;
        Roles = user.UserRoles is not null
            ? user.UserRoles.Select(r => new RoleOutput
            {
                Id = r.Role.Id,
                Name = r.Role.Name ?? "",
                Color = r.Role.Color ?? "#fffff"
            }).ToList()
            : [];
        ArchivedAt = user.ArchivedAt;
        AffectedToTeamleader = affectedToTeamleader is not null ? new UserOutput(affectedToTeamleader) : null;
    }

    public Guid Id { get; set; }
    public string? Firstname { get; set; }
    public string Lastname { get; set; }
    public string Email { get; set; }
    public UserOutput? AffectedToTeamleader { get; set; }

    public string? Color { get; set; }
    public List<RoleOutput> Roles { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
}

public class EmployeeOutput
{
    public EmployeeOutput()
    {
    }

    public EmployeeOutput(ApplicationUser user)
    {
        Id = user.Id;
        Firstname = user.Firstname ?? string.Empty;
        Lastname = user.Lastname ?? string.Empty;
        Email = user.Email ?? string.Empty;
        PhoneNumber = user.PhoneNumber;
        Roles = user.UserRoles.Select(r => new RoleOutput
        {
            Id = r.Role.Id,
            Name = r.Role.Name ?? "",
            Color = r.Role.Color ?? "#fffff"
        });
        UserAbsences =
            user.UserAbsences?.Select(ua => new UserAbsenceOutput(ua)).ToList() ?? [];
    }

    public Guid Id { get; set; }
    public string Firstname { get; set; }
    public string Lastname { get; set; }
    public string Email { get; set; }
    public string? PhoneNumber { get; set; }
    public IEnumerable<RoleOutput>? Roles { get; set; }
    public DateTimeOffset? CreatedAt { get; set; }
    public List<UserAbsenceOutput>? UserAbsences { get; set; }
}

public class ProfileInput
{
    [Required] public string Lastname { get; set; }

    public required string? Firstname { get; set; }

    [Required] public required string Email { get; set; }

    [Required] public required string PhoneNumber { get; set; }

    public string? Color { get; set; } = "#000000";
}

public class ProfileOutput
{
    [SetsRequiredMembers]
    public ProfileOutput(ApplicationUser user)
    {
        Lastname = user.Lastname;
        Firstname = user.Firstname;
        Email = user.Email;
        PhoneNumber = user.PhoneNumber;
        Color = user.Color;
    }

    public required string Lastname { get; set; }
    public string? Firstname { get; set; }
    public required string Email { get; set; }
    public required string PhoneNumber { get; set; }
    public string? Color { get; set; } = "#000000";
}

public class UserTagOutput
{
    [SetsRequiredMembers]
    public UserTagOutput(ApplicationUser user)
    {
        Id = user.Id;
        Trigram = user.Firstname[0].ToString().ToUpper() + user.Lastname[0].ToString().ToUpper();
        Color = user.Color;
        Firstname = user.Firstname;
        Lastname = user.Lastname;
        AffectedOperators = user.AffectedOperatorsToTeamleader?.Select(aff => new OperatorOutput( aff.Operator, isDefault: aff.IsDefault,dateFrom: aff.StartedAt, dateTo : aff.EndedAt)).ToList() ?? [];
        //Missions = user.AffectatedMissionXTeamLeaders?.OrderBy(x => x.OrderIndex).Select(m => new MissionOutput(m.Mission, m)) ?? [];
    }

    public Guid Id { get; set; }
    public string? Color { get; set; } = "#000000";
    public string? Trigram { get; set; }
    public  string Lastname { get; set; }
    public string Firstname { get; set; }
    public ICollection<OperatorOutput> AffectedOperators { get; set; }


}

public class AffectationTeamLeaderOperatorInput
{
    public Guid TeamleaderId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset EndedAt { get; set; }
    public List<Guid> OperatorsIds { get; set; }
}