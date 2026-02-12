using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using opteeam_api.DTOs;
using opteeam_api.Migrations;

namespace opteeam_api.Models;

public class ApplicationUser : IdentityUser<Guid>
{
    public string? Firstname { get; set; }

    [Required] public string Lastname { get; set; }

    public string? RefreshToken { get; set; }
    public string? Color { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTimeOffset CreatedAt { get; set; } = DateTime.Now.ToUniversalTime();

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public DateTimeOffset? LastModified { get; set; } = DateTime.Now.ToUniversalTime();

    public DateTimeOffset? ArchivedAt { get; set; }
    public ICollection<ApplicationUserRole> UserRoles { get; set; }
    public ICollection<UserAbsence> UserAbsences { get; set; }

    [InverseProperty("Teamleader")]
    public ICollection<AffectationTeamleaderXOperator> AffectedOperatorsToTeamleader { get; set; }

    [InverseProperty("Operator")]
    public ICollection<AffectationTeamleaderXOperator> AffectedTeamleadersforOperator { get; set; }

    public ICollection<AffectationMissionXTeamLeader> AffectatedMissionXTeamLeaders { get; set; }

    #region Client properties

    public string? PhoneNumber { get; set; }

    #endregion


    [NotMapped] public string FullName => $"{Firstname} {Lastname}";

    #region Constructeurs

    public ApplicationUser()
    {
    }

    public ApplicationUser(BaseUserInput userInput)
    {
        UserName = userInput.Email;
        Email = userInput.Email;
        Lastname = userInput.Lastname;
        Firstname = userInput.Firstname;
        UserRoles = userInput.RoleIds.Select(roleId => new ApplicationUserRole { RoleId = roleId }).ToList();
        ArchivedAt = userInput.ArchivedAt;
        Color = userInput.Color;
    }

    public ApplicationUser(UserInput model, string password, UserManager<ApplicationUser> userManager) : this(model)
    {
        UserName = model.Email;
        Email = model.Email;
        Lastname = model.Lastname;
        Firstname = model.Firstname;
        UserRoles = model.RoleIds.Select(roleId => new ApplicationUserRole { RoleId = roleId }).ToList();
        ArchivedAt = model.ArchivedAt;
        Color = model.Color;
        userManager.CreateAsync(this, password).Wait();
    }

    #endregion

    #region Gestion User

    public void UpdateUserBase(BaseUserInput userUpdateInfos)
    {
        UserName = userUpdateInfos.Email;
        Email = userUpdateInfos.Email;
        Lastname = userUpdateInfos.Lastname;
        Firstname = userUpdateInfos.Firstname;
        UserRoles = userUpdateInfos.RoleIds.Select(roleId => new ApplicationUserRole { RoleId = roleId }).ToList();
        ArchivedAt = userUpdateInfos.ArchivedAt;
        Color = userUpdateInfos.Color;
        if (userUpdateInfos is UserInput userInput) Firstname = userInput.Firstname;
    }

    public void UpdateCurrentUser(ProfileInput userProfile)
    {
        Firstname = userProfile.Firstname;
        Lastname = userProfile.Lastname;
        Email = userProfile.Email;
        PhoneNumber = userProfile.PhoneNumber;
        Color = userProfile.Color;
    }

    #endregion
}

public class UserDocument : BaseFile<UserDocumentType>
{
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))] public ApplicationUser User { get; set; }
    public string Name { get; set; }
    public DateTimeOffset? ExpirationDate { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
}

public class UserAbsence : BaseFile<AbsenceType>, IArchivable
{
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))] public ApplicationUser User { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public string Comments { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
}

public class AbsenceType : BaseType
{
}

public class UserDocumentType : BaseType
{
}

public class OperatorOutput
{
    public string  FullName { get; set; }
    public Guid UserId { get; set; }
    public bool IsDefault { get; set; }
    public DateTimeOffset DateFrom { get; set; }
    public DateTimeOffset? DateTo { get; set; }

    public OperatorOutput(ApplicationUser user, bool isDefault, DateTimeOffset dateFrom, DateTimeOffset? dateTo = null)
    {
        FullName = user.FullName;
        IsDefault = isDefault;
        DateFrom = dateFrom;
        DateTo = dateTo;
        UserId = user.Id;
    }
}