using System.ComponentModel.DataAnnotations.Schema;

namespace opteeam_api.Models
{
    public class AffectationMissionXTeamLeader : BaseModel, IArchivable
    {
        public Guid MissionId { get; set; }
        [ForeignKey(nameof(MissionId))]
        [InverseProperty(nameof(Mission.AffectatedMissionXTeamLeaders))]
        public Mission Mission { get; set; }
        public Guid? TeamLeaderId { get; set; }
        [ForeignKey(nameof(TeamLeaderId))]
        [InverseProperty(nameof(ApplicationUser.AffectatedMissionXTeamLeaders))]
        public ApplicationUser? TeamLeader { get; set; }
        public DateTimeOffset AssignedAt { get; set; }
        public bool IsHidden { get; set; } = false;
        public short OrderIndex { get; set; }
        public DateTimeOffset? ArchivedAt { get; set; }
    }
}
