using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Utils;

namespace opteeam_api.Controllers;

/// <summary>
///     Gestion des statuts de commandes
/// </summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[Consumes("application/json")]
[Authorize]
public class OrderStatusController(ApplicationDbContext dbContext) : ControllerBase
{
    #region GET OrderStatus list

    /// <summary>
    ///     Récupérer la liste des statuts de commande
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<OrderStatusOutput>>> GetList()
    {
        try
        {
            var orderStatuses = await dbContext.OrderStatuses
                .AsNoTracking()
                .OrderBy(s => s.Position)
                .ToListAsync(); 
            return Ok(orderStatuses.Select(status => new OrderStatusOutput(status)).ToList());
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region GET OrderStatus details

    /// <summary>
    ///     Récupérer les détails d’un statut de commande
    /// </summary>
    [HttpGet("{orderStatusId:guid}")]
    public async Task<ActionResult<OrderStatusOutput>> GetDetail(Guid orderStatusId)
    {
        var status = await dbContext.OrderStatuses
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == orderStatusId);

        if (status == null)
            return NotFound(HardCode.ORDER_STATUS_NOT_FOUND);

        return Ok(new OrderStatusOutput(status));
    }

    #endregion

    #region POST Create OrderStatus

    /// <summary>
    ///     Créer un nouveau statut de commande
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Guid>> Create([FromBody] OrderStatusInput orderStatusInput)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var newStatus = new OrderStatus
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Name = orderStatusInput.Name,
            Color = orderStatusInput.Color,
            Icon = orderStatusInput.Icon
        };

        dbContext.OrderStatuses.Add(newStatus);
        await dbContext.SaveChangesAsync();

        return Ok(newStatus.Id);
    }

    #endregion

    #region PUT Update OrderStatus

    /// <summary>
    ///     Modifier un statut de commande existant
    /// </summary>
    [HttpPut("{orderStatusId:guid}")]
    public async Task<ActionResult<OrderStatusOutput>> Update(Guid orderStatusId,
        [FromBody] OrderStatusInput orderStatusInput)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existingStatus = await dbContext.OrderStatuses.FirstOrDefaultAsync(s => s.Id == orderStatusId);
        if (existingStatus == null)
            return NotFound(HardCode.ORDER_STATUS_NOT_FOUND);

        existingStatus.Name = orderStatusInput.Name;
        existingStatus.Color = orderStatusInput.Color;
        existingStatus.Icon = orderStatusInput.Icon;
        existingStatus.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(new OrderStatusOutput(existingStatus));
    }

    #endregion

    #region DELETE Delete OrderStatus

    /// <summary>
    ///     Supprimer un statut de commande
    /// </summary>
    [HttpDelete("{orderStatusId:guid}")]
    public async Task<IActionResult> Delete(Guid orderStatusId)
    {
        var status = await dbContext.OrderStatuses.FirstOrDefaultAsync(s => s.Id == orderStatusId);
        if (status == null)
            return NotFound(HardCode.ORDER_STATUS_NOT_FOUND);

        //dbContext.OrderStatuses.Remove(status);
        status.ArchivedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    #endregion
}