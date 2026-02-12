using System.ComponentModel.DataAnnotations.Schema;

namespace opteeam_api.Models;

public class AffectationTeamleaderXOperator : BaseModel, IArchivable
{
    public Guid TeamleaderId { get; set; }
    public Guid OperatorId { get; set; }
    public bool IsDefault { get; set; } = true;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    [ForeignKey(nameof(TeamleaderId))]
    public ApplicationUser Teamleader { get; set; }
    [ForeignKey(nameof(OperatorId))]
    public ApplicationUser Operator { get; set; }
    public AffectationTeamleaderXOperator()
    {
    }
    public AffectationTeamleaderXOperator(Guid teamleaderId, Guid operatorId)
    {
        TeamleaderId = teamleaderId;
        OperatorId = operatorId;
        StartedAt = DateTime.Now.Date.ToUniversalTime();
    }
}

public class AffectationTeamleaderXOperatorInput
{
    public Guid TeamleaderId { get; set; }
    public Guid OperatorId { get; set; }
    public bool IsDefault { get; set; } = true;
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
}
