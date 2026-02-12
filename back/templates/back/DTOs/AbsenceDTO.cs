using opteeam_api.Models;

namespace opteeam_api.DTOs;


public class AbsenceTypeOutput
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Color { get; set; }
    public string Icon { get; set; }


    public AbsenceTypeOutput(AbsenceType absenceType)
    {
        {
            Id = absenceType.Id;
            Name = absenceType?.Name ?? "Abscence";
            Color = absenceType.Color ?? "#FFFFFF";
            Icon = absenceType.Icon ?? "users";
        }
    }
}

public class AbsenceTypeInput
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Color { get; set; }
    public string Icon { get; set; }

}

public class UserAbsenceInput
{
    public Guid TypeId { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public string Comments { get; set; } = string.Empty;
}

public class UserAbsenceOutput
{
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public string Comments { get; set; }
    public AbsenceTypeOutput Type { get; set; }

    public UserAbsenceOutput(UserAbsence absence)
    {
        StartDate = absence.StartDate;
        EndDate = absence.EndDate;
        Comments = absence.Comments;
        Type = new AbsenceTypeOutput(absence.Type);

    }
}
