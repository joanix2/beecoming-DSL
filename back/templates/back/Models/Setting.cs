using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace opteeam_api.Models;

public class Setting: BaseModel
{
    public string? ApplicationName { get; set; }
    public string? ApplicationLogo { get; set; }
    public string? ApplicationFlavicon  { get; set; }
    public string? DefaultPlanningMode { get; set; } // "day" or "week" 
    public bool? ShowWeekendsInPlanning { get; set; }
    public bool? MissionAsAppointment { get; set; }
    public bool? GrayOutFinishedMissions { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? TertiaryColor { get; set; }
    public Address? OperatorStartAddress { get; set; }
    public Address? BillingAddress { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? Url { get; set; }
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public string? SirenNumber { get; set; }
    public string? LegalForm { get; set; }
    public string? ApeCode { get; set; }

    [JsonIgnore]
    [NotMapped]
    public string MinioFolderName => "settings";
}