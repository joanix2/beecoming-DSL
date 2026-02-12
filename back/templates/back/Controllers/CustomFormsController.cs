using api.Models;
using api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;

namespace opteeam_api.Controllers;

/// <summary>
///     Controller pour les custom forms
/// </summary>
/// <param name="dbContext"></param>
[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
[Authorize]
public class CustomFormsController(ApplicationDbContext dbContext) : ControllerBase
{
    #region GET CustomForms List

    /// <summary>
    ///     Récupérer la liste des types de formulaire
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ListResponse<CustomFormListOutput>>> GetCustomFormsList(
        ODataQueryOptions<CustomForm> options)
    {
        try
        {
            var customForms = dbContext.CustomForm
                .Include(c => c.MissionType)
                .Select(c => c);

            var customFormList = options.ApplyAndGetCount(customForms, out var count)
                .Cast<CustomForm>()
                .ToList();

            // TODO: Get export file
            // TODO: replace null with export file
            // return Ok(customForms.Select(c => new CustomFormOutput(c, null)).ToList());

            return Ok(new ListResponse<CustomFormListOutput>(
                customFormList.Select(c => new CustomFormListOutput(c, null)),
                count
            ));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region GET CustomForm details

    /// <summary>
    ///     Récupérer un custom form par son ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomFormOutput>> GetCustomFormById(Guid id)
    {
        var customForm = await dbContext.CustomForm
            .Where(c => c.Id == id)
            .FirstOrDefaultAsync();

        if (customForm == null)
            return NotFound("CUSTOM_FORM_NOT_FOUND");

        // TODO: Get export file        
        // TODO: replace null with export file

        return Ok(new CustomFormOutput(customForm, null));
    }

    #endregion

    #region POST Create CustomForm

    /// <summary>
    ///     Créer un nouveau type de formulaire
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CustomFormOutput>> CreateCustomFormType([FromBody] CustomFormInput customFormInput)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var customForm = new CustomForm(customFormInput);
            dbContext.CustomForm.Add(customForm);
            await dbContext.SaveChangesAsync();

            // TODO: Generate export file
            // TODO: replace null with export file
            return Ok(new CustomFormOutput(customForm, null));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region PUT Update CustomForm

    /// <summary>
    ///     Met à jour un type de formulaire
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CustomFormOutput>> UpdateCustomFormType(Guid id,
        [FromBody] CustomFormInput customFormInput)
    {
        var customForm = await dbContext.CustomForm.FindAsync(id);
        if (customForm == null)
            return NotFound("CUSTOM_FORM_NOT_FOUND");

        // Mise à jour des propriétés de base
        customForm.Name = customFormInput.Name;
        customForm.Color = customFormInput.Color;
        customForm.Icon = customFormInput.Icon;
        customForm.MissionTypeId = customFormInput.MissionTypeId;

        // Mise à jour de la structure
        customForm.Structure = new FormStructure(new FormStructureInput
        {
            Sections = customFormInput.Structure.Sections.Select(s => new SectionInput
            {
                Id = s.Id,
                Name = s.Name,
                Fields = s.Fields.Select(f => new FieldInput
                {
                    Id = f.Id,
                    Label = f.Label,
                    Type = f.Type,
                    IsRequired = f.IsRequired,
                    IsReadOnly = f.IsReadOnly,
                    IsDeleted = f.IsDeleted,
                    Order = f.Order,
                    Options = f.Options?.Select(o => new OptionInput
                    {
                        Id = o.Id,
                        Label = o.Label,
                        IsDeleted = o.IsDeleted,
                        Order = o.Order
                    }).ToList()
                }).ToList()
            }).ToList()
        });

        await dbContext.SaveChangesAsync();

        // TODO: Generate export file
        // TODO: replace null with export file
        return Ok(new CustomFormOutput(customForm, null));
    }

    #endregion

    #region DELETE CustomForm

    /// <summary>
    ///     Supprime un custom form
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteCustomForm(Guid id)
    {
        var customForm = await dbContext.CustomForm.FindAsync(id);
        if (customForm == null)
            return NotFound("CUSTOM_FORM_NOT_FOUND");

        try
        {
            customForm.ArchivedAt = DateTimeOffset.UtcNow;
            dbContext.CustomForm.Update(customForm);
            await dbContext.SaveChangesAsync();

            return Ok();
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region UNARCHIVE CustomForm

    /// <summary>
    ///     Désarchiver un custom form
    /// </summary>
    [HttpPost("{id:guid}/unarchive")]
    public async Task<ActionResult> UnarchiveCustomForm(Guid id)
    {
        var customForm = await dbContext.CustomForm.FindAsync(id);
        if (customForm == null)
            return NotFound("CUSTOM_FORM_NOT_FOUND");

        customForm.ArchivedAt = null;
        dbContext.CustomForm.Update(customForm);
        await dbContext.SaveChangesAsync();

        return Ok();
    }

    #endregion

    #region GET Default CustomForm

    /// <summary>
    ///     Récupère le custom form par défaut
    /// </summary>
    [HttpGet("default")]
    public ActionResult<FormStructure> GetDefaultCustomForm()
    {
        return Ok(FormStructure.GenerateDefaultFormStructure());
    }

    #endregion

    #region GET field types

    /// <summary>
    ///     Récupère les types de champs
    /// </summary>
    [HttpGet("field-types")]
    [AllowAnonymous]
    public ActionResult<Dictionary<string, FieldTypeDefinition>> GetFieldTypeDefinition()
    {
        return Ok(FieldTypeDefinition.All);
    }

    #endregion

    #region GET CustomForm by MissionType

    /// <summary>
    ///     Récupère le custom form associé à un type de mission
    /// </summary>
    [HttpGet("by-mission-type/{missionTypeId:guid}")]
    public async Task<ActionResult<List<CustomFormListOutput>>> GetCustomFormByMissionType(Guid missionTypeId)
    {
        try
        {
            var CustomForms = dbContext.CustomForm
                .Where(c => c.MissionTypeId == missionTypeId)
                .AsNoTracking();

            if (CustomForms == null)
                return NotFound("MISSION_TYPE_NOT_FOUND");

            return Ok(CustomForms.Select(c => new CustomFormListOutput(c, null)).ToList());
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region GET CustomForm by MissionType with base answer

    /// <summary>
    ///     Récupère le custom form associé à un type de mission avec les données de base
    /// </summary>
    [HttpGet("by-mission-type/{missionTypeId:guid}/base-answer")]
    public async Task<ActionResult<List<CustomFormWithBaseAnswerOutput>>> GetCustomFormByMissionTypeWithBaseAnswer(
        Guid missionTypeId)
    {
        try
        {
            var customForms = await dbContext.CustomForm
                .Where(c => c.MissionTypeId == missionTypeId)
                .ToListAsync();

            return Ok(customForms.Select(c => new CustomFormWithBaseAnswerOutput(c, null)).ToList());
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion
}