using api.Models;
using api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;

namespace opteeam_api.Controllers;

[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
[Authorize]
public class MissionTypesController(ApplicationDbContext dbContext) : ControllerBase
{
    #region GET MissionType list

    /// <summary>
    ///     Récupérer la liste des types de mission
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ListResponse<MissionTypeListOutput>>> GetMissionTypesList(
        ODataQueryOptions<MissionType> options)
    {
        try
        {
            var MissionTypes = dbContext.MissionTypes
                .Include(m => m.CustomForms)
                .AsNoTracking();
            MissionTypes = options.ApplyAndGetCount(MissionTypes, out var count);

            return Ok(new ListResponse<MissionTypeListOutput>(
                MissionTypes.Select(m => new MissionTypeListOutput(m)).ToList(),
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

    #region GET MissionType details

    /// <summary>
    ///     Récupérer les détails d'un type de mission
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MissionTypeOutput>> GetMissionTypeDetails(Guid id)
    {
        var MissionType = await dbContext.MissionTypes
            .Where(m => m.Id == id)
            .Include(m => m.CustomForms)
            .FirstOrDefaultAsync();

        if (MissionType == null)
            return NotFound("MISSION_TYPE_NOT_FOUND");

        return Ok(MissionType.Output);
    }

    #endregion

    #region POST Create MissionType

    /// <summary>
    ///     Créer un nouveau type de mission
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MissionTypeOutput>> CreateMissionType([FromBody] MissionTypeInput missionTypeInput)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var MissionType = new MissionType(missionTypeInput);
            dbContext.MissionTypes.Add(MissionType);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMissionTypeDetails), new { id = MissionType.Id },
                new MissionTypeOutput(MissionType));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region PUT Update MissionType

    /// <summary>
    ///     Mettre à jour un type de mission
    /// </summary>
    /// <param name="id"></param>
    /// <param name="missionTypeInput"></param>
    /// <returns></returns>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MissionTypeOutput>> UpdateMissionType(Guid id,
        [FromBody] MissionTypeInput missionTypeInput)
    {
        var MissionType = await dbContext.MissionTypes.FindAsync(id);
        if (MissionType == null)
            return NotFound("MISSION_TYPE_NOT_FOUND");

        MissionType.OrderTypeId = missionTypeInput.OrderTypeId;
        MissionType.Name = missionTypeInput.Name;
        MissionType.Color = missionTypeInput.Color;
        MissionType.Icon = missionTypeInput.Icon;
        MissionType.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(MissionType.Output);
    }

    #endregion

    #region DELETE MissionType

    /// <summary>
    ///     Supprimer un type de mission
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMissionType(Guid id)
    {
        var missionType = await dbContext.MissionTypes.FindAsync(id);
        if (missionType == null)
            return NotFound("MISSION_TYPE_NOT_FOUND");

        try
        {
            missionType.ArchivedAt = DateTimeOffset.UtcNow;
            dbContext.MissionTypes.Update(missionType);
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

    #region UNARCHIVE MissionType

    /// <summary>
    ///     Désarchiver un type de mission
    /// </summary>
    [HttpPost("{id:guid}/unarchive")]
    public async Task<IActionResult> UnarchiveMissionType(Guid id)
    {
        var missionType = await dbContext.MissionTypes.FindAsync(id);
        if (missionType == null)
            return NotFound("MISSION_TYPE_NOT_FOUND");

        try
        {
            missionType.ArchivedAt = null;
            dbContext.MissionTypes.Update(missionType);
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

    #region GET MissionType by OrderType

    /// <summary>
    ///     Récupérer les types de mission associés à un type de commande
    /// </summary>
    [HttpGet("by-order-type/{orderTypeId:guid}")]
    public async Task<ActionResult<List<MissionTypeListOutput>>> GetMissionTypesByOrderType(Guid orderTypeId)
    {
        try
        {
            var missionTypes = dbContext.MissionTypes
                .Where(m => m.OrderTypeId == orderTypeId)
                .AsNoTracking();

            if (missionTypes == null)
                return NotFound("ORDER_TYPE_NOT_FOUND");

            return Ok(missionTypes.Select(m => new MissionTypeListOutput(m)).ToList());
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion
}