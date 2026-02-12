// Controllers/AbsenceTypeController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Utils;

namespace opteeam_api.Controllers;

[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
//[Authorize]
public class AbsenceTypesController(ApplicationDbContext dbContext) : ControllerBase
{
    #region GET all absence types

    /// <summary>
    /// Récupérer la liste des types d'absence
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AbsenceTypeOutput>>> GetAllAbsenceTypes()
    {
        var absenceTypes = await dbContext.AbsenceTypes.AsNoTracking().ToListAsync();
        return Ok(absenceTypes.Select(a => new AbsenceTypeOutput(a)).ToList());
    }

    #endregion

    #region POST create absence type

    /// <summary>
    /// Créer un nouveau type d'absence
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AbsenceTypeOutput>> CreateAbsenceType([FromBody] AbsenceTypeInput absenceTypeInput)
    {
        var absenceType = new AbsenceType
        {
            Id = Guid.NewGuid(),
            Name = absenceTypeInput.Name,
            Color = absenceTypeInput.Color,
            Icon = absenceTypeInput.Icon
        };

        dbContext.AbsenceTypes.Add(absenceType);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAbsenceTypeDetails), new { id = absenceType.Id }, new AbsenceTypeOutput(absenceType));
    }

    #endregion

    #region GET AbsenceType details

    /// <summary>
    /// Récupérer les détails d'un type d'absence
    /// </summary>
    /// <param name="id">Identifiant du type d'absence</param>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AbsenceTypeOutput>> GetAbsenceTypeDetails(Guid id)
    {
        var absenceType = await dbContext.AbsenceTypes.FirstOrDefaultAsync(a => a.Id == id);
        if (absenceType == null)
        {
            return NotFound(HardCode.ABSENCE_TYPE_NOT_FOUND);
        }

        return Ok(new AbsenceTypeOutput(absenceType));
    }

    #endregion

    #region PUT update absence type

    /// <summary>
    /// Mettre à jour un type d'absence
    /// </summary>
    /// <param name="id">Identifiant du type d'absence</param>
    /// <param name="absenceTypeInput">Nouvelles données du type d'absence</param>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AbsenceTypeOutput>> UpdateAbsenceType(Guid id, [FromBody] AbsenceTypeInput absenceTypeInput)
    {
        var absenceType = await dbContext.AbsenceTypes.FirstOrDefaultAsync(a => a.Id == id);
        if (absenceType == null)
        {
            return NotFound(HardCode.ABSENCE_TYPE_NOT_FOUND);
        }

        absenceType.Name = absenceTypeInput.Name;
        absenceType.Color = absenceTypeInput.Color;
        absenceType.Icon = absenceTypeInput.Icon;

        dbContext.AbsenceTypes.Update(absenceType);
        await dbContext.SaveChangesAsync();
        
        return Ok(new AbsenceTypeOutput(absenceType));
    }

    #endregion

    #region DELETE absence type

    /// <summary>
    /// Supprimer un type d'absence
    /// </summary>
    /// <param name="id">Identifiant du type d'absence</param>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAbsenceType(Guid id)
    {
        var absenceType = await dbContext.AbsenceTypes.FirstOrDefaultAsync(a => a.Id == id);
        if (absenceType == null)
            return NotFound(HardCode.ABSENCE_TYPE_NOT_FOUND);

        // Check if there are user absences using this type
        var hasAbsences = await dbContext.UserAbsences.AnyAsync(a => a.TypeId == id);
        if (hasAbsences)
        {
            return BadRequest("Ce type d'absence est utilisé par des absences existantes et ne peut pas être supprimé.");
        }

        absenceType.ArchivedAt = DateTime.UtcNow;

        //dbContext.AbsenceTypes.Remove(absenceType);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    #endregion
}
