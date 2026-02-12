using System.ComponentModel.DataAnnotations;

namespace opteeam_api.DTOs;

public class FileUrlResponse
{
    [Required]
    public string Url { get; set; } = string.Empty;
}

public class FileInfoResponse
{
    [Required]
    public required string Name { get; set; } = string.Empty;
    [Required]
    public required string Url { get; set; } = string.Empty;
    public DateTimeOffset? UploadDate { get; set; }
}