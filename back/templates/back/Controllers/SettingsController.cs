using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Services;

namespace opteeam_api.Controllers;

[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
public class SettingsController(ApplicationDbContext dbContext, AddressService adressService, MinioService minioService) : ControllerBase
{
    #region GET Setting
    /// <summary>
    /// Récupérer les paramètres de l'application
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<SettingOutput>> GetSettings()
    {
        var setting = await dbContext.Settings.FirstOrDefaultAsync();
        setting.ApplicationFlavicon = await minioService.GetFileUrlAsync(setting.ApplicationFlavicon);
        setting.ApplicationLogo = await minioService.GetFileUrlAsync(setting.ApplicationLogo);
        if (setting == null)
        {
            return NotFound("SETTING_NOT_FOUND");
        }

        return new SettingOutput(setting);
    }
    #endregion

    #region GET Company
    /// <summary>
    /// Récupérer les informations de la société
    /// </summary>
    [HttpGet("company")]
    public async Task<ActionResult<SettingCompanyOutput>> GetCompany()
    {
        var setting = await dbContext.Settings.Include(s => s.BillingAddress).FirstOrDefaultAsync();
        if (setting == null)
        {
            return NotFound("SETTING_NOT_FOUND");
        }

        return new SettingCompanyOutput
        {
            CompanyName = setting.CompanyName,
            SirenNumber = setting.SirenNumber,
            LegalForm = setting.LegalForm,
            ApeCode = setting.ApeCode,
            BillingAddress = setting.BillingAddress,
            Phone = setting.Phone,
            Fax = setting.Fax,
            Url = setting.Url,
            Email = setting.Email,
        };
    }
    #endregion

    #region GET Customization
    /// <summary>
    /// Récupérer les paramètres de personnalisation
    /// </summary>
    [HttpGet("customization")]
    public async Task<ActionResult<SettingCustomizationOutput>> GetCustomization()
    {
        var setting = await dbContext.Settings.Include(s => s.OperatorStartAddress).FirstOrDefaultAsync();
        if (setting == null)
        {
            return NotFound("SETTING_NOT_FOUND");
        }

        var logoUrl = await minioService.GetFileUrlAsync(setting.ApplicationLogo);
        var flaviconUrl = await minioService.GetFileUrlAsync(setting.ApplicationFlavicon);

        return new SettingCustomizationOutput
        {
            Id = setting.Id,
            ApplicationName = setting.ApplicationName,
            ApplicationLogo = logoUrl,
            ApplicationFlavicon = flaviconUrl,
            PrimaryColor = setting.PrimaryColor,
            SecondaryColor = setting.SecondaryColor,
            TertiaryColor = setting.TertiaryColor,
            OperatorStartAddress = setting.OperatorStartAddress,
        };
    }
    #endregion

    #region GET preferences
    /// <summary>
    /// Récupérer les paramètres de personnalisation
    /// </summary>
    [HttpGet("preference")]
    public async Task<ActionResult<SettingPreferenceOutput>> GetPreferences()
    {
        var setting = await dbContext.Settings.Include(s => s.OperatorStartAddress).FirstOrDefaultAsync();
        if (setting == null)
        {
            return NotFound("SETTING_NOT_FOUND");
        }

        return new SettingPreferenceOutput
        {
            Id = setting.Id,
            DefaultPlanningMode = setting.DefaultPlanningMode,
            ShowWeekendsInPlanning = setting.ShowWeekendsInPlanning,
            GrayOutFinishedMissions = setting.GrayOutFinishedMissions,
            MissionAsAppointment = setting.MissionAsAppointment
        };
    }
    #endregion

    #region PATCH Setting
    /// <summary>
    /// Mettre à jour les paramètres de l'application
    /// </summary>
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<SettingOutput>> PatchSettings(Guid id, [FromBody] SettingInput settingInput)
    {
        var setting = await dbContext.Settings.FindAsync(id);
        if (setting == null)
            return NotFound("SETTING_NOT_FOUND");

        var inputProperties = typeof(SettingInput).GetProperties();
        var settingProperties = typeof(Setting).GetProperties();

        foreach (var inputProp in inputProperties)
        {
            var value = inputProp.GetValue(settingInput);
            if (value != null && inputProp.Name != "Id")
            {
                // Cas spéciaux pour les adresses
                if (inputProp.Name == "OperatorStartAddress" && value is AddressInput operatorAddress)
                {
                    setting.OperatorStartAddress = await adressService.CreateOrUpdateAddressAsync(operatorAddress);
                }
                else if (inputProp.Name == "BillingAddress" && value is AddressInput billingAddress)
                {
                    setting.BillingAddress = await adressService.CreateOrUpdateAddressAsync(billingAddress);
                }
                else
                {
                    // Cas standard pour les autres propriétés
                    var settingProp = settingProperties.FirstOrDefault(p => p.Name == inputProp.Name);
                    if (settingProp != null && settingProp.CanWrite)
                    {
                        settingProp.SetValue(setting, value);
                    }
                }
            }
        }

        await dbContext.SaveChangesAsync();
        return new SettingOutput(setting);
    }
    #endregion
}