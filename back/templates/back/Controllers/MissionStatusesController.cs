using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;

namespace opteeam_api.Controllers;

[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
[Authorize]
public class MissionStatusesController(ApplicationDbContext dbContext) : ControllerBase
{
    #region GET MissionStatus list
    /// <summary>
    /// Récupérer la liste des statuts de mission.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<MissionStatusOutput>>> GetList()
    {
        try
        {
            List<MissionStatus> missionStatuses = await dbContext.MissionStatuses
                .AsNoTracking()
                .OrderBy(s => s.Position)
                .ToListAsync();
            return Ok(missionStatuses.Select(status => new MissionStatusOutput(status)).ToList());
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }
    #endregion

    #region GET MissionStatus details
    /// <summary>
    /// Récupérer les détails d’un statut de mission.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MissionStatusOutput>> GetById(Guid id)
    {
        var status = await dbContext.MissionStatuses.FindAsync(id);
        if (status == null)
            return NotFound("MISSION_STATUS_NOT_FOUND");

        return Ok(new MissionStatusOutput(status));
    }
    #endregion

    #region POST Create MissionStatus
    /// <summary>
    /// Créer un nouveau statut de mission.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MissionStatusOutput>> Create([FromBody] MissionStatusInput missionStatusInput)
    {
        var status = new MissionStatus
        {
            Id = Guid.NewGuid(),
            Name = missionStatusInput.Name,
            Color = missionStatusInput.Color,
            Icon = missionStatusInput.Icon
        };

        dbContext.MissionStatuses.Add(status);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = status.Id }, new MissionStatusOutput(status));
    }
    #endregion

    #region PUT Update MissionStatus
    /// <summary>
    /// Modifier un statut de mission.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MissionStatusOutput>> Update(Guid id, [FromBody] MissionStatusInput missionsStatusInput)
    {
        var status = await dbContext.MissionStatuses.FindAsync(id);
        if (status == null)
            return NotFound("MISSION_STATUS_NOT_FOUND");

        status.Name = missionsStatusInput.Name;
        status.Color = missionsStatusInput.Color;
        status.Icon = missionsStatusInput.Icon;

        await dbContext.SaveChangesAsync();
        return Ok(new MissionStatusOutput(status));
    }
    #endregion

    #region DELETE Delete MissionStatus
    /// <summary>
    /// Supprimer un statut de mission.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<Guid>> Delete(Guid id)
    {
        var status = await dbContext.MissionStatuses.FindAsync(id);
        if (status == null)
            return NotFound("MISSION_STATUS_NOT_FOUND");

        //dbContext.MissionStatuses.Remove(status);
        status.ArchivedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();
        return Ok(id);
    }
    #endregion
}
