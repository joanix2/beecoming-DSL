using System.ComponentModel.DataAnnotations;

namespace opteeam_api.DTOs;

public class BaseUserInput
{
    public required string? Firstname { get; set; }

    [Required] public required string Lastname { get; set; }

    [Required] [EmailAddress] public required string Email { get; set; }

    public string? Color { get; set; }

    [Required] [MinLength(1)] public required List<Guid> RoleIds { get; set; }

    public DateTimeOffset? ArchivedAt { get; set; }
}