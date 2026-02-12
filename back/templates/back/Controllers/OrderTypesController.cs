using api.Models;
using api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Utils;

namespace opteeam_api.Controllers;

/// <summary>
/// Gestion des types de commandes
/// </summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[Consumes("application/json")]
[Authorize]
public class OrderTypesController(ApplicationDbContext dbContext) : ControllerBase
{
    #region GET OrderType list
    /// <summary>
    /// Récupérer la liste des types de commandes
    /// </summary>
    [HttpGet]
    public ActionResult<ListResponse<OrderTypeListOutput>> GetOrderTypeList(ODataQueryOptions<OrderType> options)
    {
        try
        {
            var OrderTypes = dbContext.OrderTypes
                .Include(ot => ot.MissionTypes)
                .AsNoTracking();
            OrderTypes = options.ApplyAndGetCount(OrderTypes, out var count);

            return Ok(new ListResponse<OrderTypeListOutput>(
                OrderTypes.Select(ot => new OrderTypeListOutput(ot)).ToList(),
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

    #region GET OrderType details
    /// <summary>
    /// Récupérer les détails d'un type de commande
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderTypeOutput>> GetOrderTypeDetail(Guid id)
    {
        var OrderType = await dbContext.OrderTypes
            .Where(ot => ot.Id == id)
            .Include(ot => ot.MissionTypes)
            .FirstOrDefaultAsync();

        if (OrderType == null)
            return NotFound("ORDER_TYPE_NOT_FOUND");

        return Ok(OrderType.Output);
    }
    #endregion

    #region POST Create OrderType
    /// <summary>
    /// Créer un nouveau type de commande
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<OrderTypeOutput>> CreateOrderType([FromBody] OrderTypeInput orderTypeInput)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var OrderType = new OrderType(orderTypeInput);
            dbContext.OrderTypes.Add(OrderType);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrderTypeDetail), new { id = OrderType.Id }, new OrderTypeOutput(OrderType));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }
    #endregion

    #region PUT Update OrdereType
    /// <summary>
    /// Modifier un type de commande existant
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OrderTypeOutput>> UpdateOrderType(Guid id, [FromBody] OrderTypeInput orderTypeInput)
    {
        var OrderType = await dbContext.OrderTypes.FindAsync(id);
        if (OrderType == null)
            return NotFound("ORDER_TYPE_NOT_FOUND");

        OrderType.Name = orderTypeInput.Name;
        OrderType.Color = orderTypeInput.Color;
        OrderType.Icon = orderTypeInput.Icon;
        OrderType.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.OrderTypes.Update(OrderType);
        await dbContext.SaveChangesAsync();

        return Ok(new OrderTypeOutput(OrderType));
    }
    #endregion

    #region DELETE OrderType
    /// <summary>
    /// Supprimer un type de commande
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOrderType(Guid id)
    {
        var OrderType = await dbContext.OrderTypes.FindAsync(id);

        if (OrderType == null)
            return NotFound("ORDER_TYPE_NOT_FOUND");

        try
        {
            OrderType.ArchivedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }
    #endregion

    #region UNARCHIVE OrderType
    /// <summary>
    /// Désarchiver un type de commande
    /// </summary>
    [HttpPost("{id:guid}/unarchive")]
    public async Task<IActionResult> UnarchiveOrderType(Guid id)
    {
        var OrderType = await dbContext.OrderTypes.FindAsync(id);
        if (OrderType == null)
            return NotFound("ORDER_TYPE_NOT_FOUND");

        try
        {
            OrderType.ArchivedAt = null;
            dbContext.OrderTypes.Update(OrderType);
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
}
