using opteeam_api.Models;
using System.Diagnostics.CodeAnalysis;

namespace opteeam_api.DTOs;

public class NotificationOutput
{
    public required Guid Id { get; set; }

    public required string Title { get; set; }
    public required string Message { get; set; }
    public required string TargetLink { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime? SeenAt { get; set; }

    [SetsRequiredMembers]
    public NotificationOutput(Notification notification)
    {
        Id = notification.Id;
        Title = notification.Title;
        Message = notification.Message;
        TargetLink = notification.TargetLink;
        CreatedAt = notification.CreatedAt;
        SeenAt = notification.SeenAt;
    }

}