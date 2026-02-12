using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class SettingInput
{
    public Guid Id { get; set; }
    public string? ApplicationName { get; set; }
    public string? ApplicationLogo { get; set; }
    public string? ApplicationFlavicon { get; set; }
    public string? DefaultPlanningMode { get; set; }
    public bool? ShowWeekendsInPlanning { get; set; }
    public bool? GrayOutFinishedMissions { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? TertiaryColor { get; set; }
    public bool? MissionAsAppointment { get; set; }
    public AddressInput? OperatorStartAddress { get; set; }
    public AddressInput? BillingAddress { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? Url { get; set; }
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public string? SirenNumber { get; set; }
    public string? LegalForm { get; set; }
    public string? ApeCode { get; set; }
}

public class SettingOutput
{
    [Required]
    public required Guid Id { get; set; }
    public string? ApplicationName { get; set; }
    public string? ApplicationLogo { get; set; }
    public string? ApplicationFlavicon { get; set; }
    public string DefaultPlanningMode { get; set; }
    public bool ShowWeekendsInPlanning { get; set; }
    public bool GrayOutFinishedMissions { get; set; }
    public string?  PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? TertiaryColor { get; set; }
    [SetsRequiredMembers]
    public SettingOutput(Setting setting)
    {   
        Id = setting.Id;
        ApplicationName = setting.ApplicationName;
        ApplicationLogo = setting.ApplicationLogo;
        ApplicationFlavicon = setting.ApplicationFlavicon;
        DefaultPlanningMode = setting.DefaultPlanningMode;
        ShowWeekendsInPlanning = setting.ShowWeekendsInPlanning ?? false;
        GrayOutFinishedMissions = setting.GrayOutFinishedMissions ?? false;
        PrimaryColor = setting.PrimaryColor;
        SecondaryColor = setting.SecondaryColor;
        TertiaryColor = setting.TertiaryColor;
    }
}

public class SettingCompanyOutput
{
    public string? CompanyName { get; set; }
    public string? SirenNumber { get; set; }
    public string? LegalForm { get; set; }
    public string? ApeCode { get; set; }
    public Address? BillingAddress { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? Url { get; set; }
    public string? Email { get; set; }
}

public class SettingCustomizationOutput
{
    [Required]
    public required Guid Id { get; set; }
    public string? ApplicationName { get; set; }
    public string? ApplicationLogo { get; set; }
    public string? ApplicationFlavicon { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? TertiaryColor { get; set; }
    public Address? OperatorStartAddress { get; set; }
}

public class SettingPreferenceOutput
{
    public Guid Id { get; set; }
    public string? DefaultPlanningMode { get; set; }
    public bool? ShowWeekendsInPlanning { get; set; }
    public bool? GrayOutFinishedMissions { get; set; }
    public bool? MissionAsAppointment { get; set; }
}