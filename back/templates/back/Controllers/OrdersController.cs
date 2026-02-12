using System.Net;
using api.Models;
using api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Services;
using opteeam_api.Utils;

namespace opteeam_api.Controllers;

/// <summary>
///     Gestion des commandes
/// </summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[Consumes("application/json")]
[Authorize]
public class OrdersController(
    ApplicationDbContext dbContext,
    AddressService addressService,
    MinioService minioService
) : ControllerBase
{
    #region POST - Filtered Order List (OData)

    /// <summary>
    ///     Récupérer la liste des commandes avec filtre
    /// </summary>
    /// <returns></returns>
    [HttpPost("datagrid")]
    public ActionResult<ListResponse<OrderOutput>> GetOrderList(
        ODataQueryOptions<Order> options,
        Guid? clientId
    )
    {
        try
        {
            var orders = dbContext
                .Orders.Include(c => c.Client)
                .Include(c => c.Type)
                .Include(x => x.Address)
                .Include(x => x.Status)
                .Include(x => x.Missions)
                .ThenInclude(m => m.Status)
                .AsNoTracking();

            if (clientId is not null)
                orders = orders.Where(x => x.ClientId == clientId);

            if (options.Search?.RawValue != null)
            {
                var search = options.Search.RawValue.ToLower();
                orders = orders.Where(c =>
                    EF.Functions.ILike(c.Client.Company, $"%{search}%")
                    || EF.Functions.ILike(c.DisplayId, $"%{search}%")
                );
            }

            var toto = orders.ToQueryString();

            orders = options.ApplyAndGetCount(orders, out var count);

            return Ok(
                new ListResponse<OrderOutput>(
                    orders.Select(c => new OrderOutput(c)).ToList(),
                    count
                )
            );
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region Get order Adresses

    [HttpPost("addresses")]
    [AllowAnonymous]
    public async Task<ActionResult<ListResponse<AddressOutput>>> GetAddressesFiltered(
        ODataQueryOptions<Order> options,
        Guid? clientId
    )
    {
        var settings = new ODataQuerySettings { PageSize = null };

        var query = dbContext
            .Orders.Include(c => c.Client)
            .Include(c => c.Type)
            .Include(x => x.Address)
            .Include(x => x.Status)
            .AsNoTracking();

        if (clientId is not null)
            query = query.Where(x => x.ClientId == clientId);

        // je ne prends pas en compte les sort .....
        if (options.Filter != null)
            query = (IQueryable<Order>)options.Filter.ApplyTo(query, settings);
        if (options.Search?.RawValue != null)
        {
            var search = options.Search.RawValue.ToLower();
            query = query.Where(c =>
                (c.Client != null && EF.Functions.ILike(c.Client.ContactName, $"%{search}%"))
                || EF.Functions.ILike(c.Client.ContactName, $"%{search}%")
            );
        }

        var queryAddress = query.Select(model => new AddressOutput
        {
            Id = model.Address.Id,
            Street = model.Address.Street,
            AdditionalInfo = model.Address.AdditionalInfo,
            PostalCode = model.Address.PostalCode,
            City = model.Address.City,
            Country = model.Address.Country,
            Latitude = model.Address.Latitude,
            Longitude = model.Address.Longitude,
        });

        var querysql = queryAddress.ToQueryString();

        var addresses = await queryAddress.ToListAsync();
        var count = addresses.Count;

        return Ok(new ListResponse<AddressOutput>(addresses, count));
    }

    #endregion

    #region GET Order details

    /// <summary>
    ///     Récupérer les détails d'une commande
    /// </summary>
    /// <returns></returns>
    [HttpGet("{orderId:guid}")]
    public async Task<ActionResult<OrderOutput>> GetOrderDetail(Guid orderId)
    {
        var order = await dbContext
            .Orders.Where(a => a.Id == orderId)
            .Include(c => c.Address)
            .Include(c => c.Client)
            .Include(c => c.Type)
            .Include(x => x.Status)
            .AsNoTracking()
            .FirstOrDefaultAsync();
        if (order == null)
            return NotFound(HardCode.CLIENT_NOT_FOUND);

        return new OrderOutput(order);
    }

    #endregion

    #region POST Create Order

    /// <summary>
    ///     Création d'une commande
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Guid>> CreateOrder([FromBody] OrderInput orderInput)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var client = await dbContext.Clients.FirstOrDefaultAsync(c => c.Id == orderInput.ClientId);
        if (client == null)
            return NotFound(HardCode.CLIENT_NOT_FOUND);

        var orderType = await dbContext.OrderTypes.FirstOrDefaultAsync(ct =>
            ct.Id == orderInput.TypeId
        );
        if (orderType == null)
            return NotFound(HardCode.ORDER_TYPE_NOT_FOUND);

        // Fix for CS8602: Ensure addressService is not null before calling CreateOrUpdateAddressAsync
        var address = await addressService.CreateOrUpdateAddressAsync(orderInput.Address);

        try
        {
            var Id = Guid.NewGuid();
            var order = new Order
            {
                DisplayId = DisplayIdGenerator.GenerateDisplayId<Order>(dbContext),
                Name = orderInput.Name,
                ClientId = client.Id,
                Address = address,
                TypeId = orderType.Id,
                Comment = orderInput.Comment,
                StatusId = orderInput.StatusId,
            };

            dbContext.Orders.Add(order);
            await dbContext.SaveChangesAsync();

            return Ok(order.Id);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region PUT Update Order

    /// <summary>
    ///     Modification d'une commande
    /// </summary>
    [HttpPut("{orderId:guid}")]
    public async Task<ActionResult<OrderOutput>> UpdateOrder(
        Guid orderId,
        [FromBody] OrderInput orderInput
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existingOrder = await dbContext
            .Orders.Where(c => c.Id == orderId)
            .Include(c => c.Client)
            .Include(c => c.Address)
            .Include(c => c.Type)
            .Include(x => x.Status)
            .FirstOrDefaultAsync();

        if (existingOrder == null)
            return NotFound(HardCode.ORDER_NOT_FOUND);

        existingOrder.Name = orderInput.Name;
        existingOrder.Comment = orderInput.Comment;
        existingOrder.ArchivedAt = orderInput.ArchivedAt;

        // Mise à jour du client si besoin
        if (existingOrder.Client?.Id != orderInput.ClientId)
        {
            var newClient = await dbContext.Clients.FirstOrDefaultAsync(c =>
                c.Id == orderInput.ClientId
            );
            if (newClient == null)
                return NotFound(HardCode.CLIENT_NOT_FOUND);
            existingOrder.Client = newClient;
        }

        // Mise à jour de l'adresse via le service de gestion des adresses
        var updatedAddress = await addressService.CreateOrUpdateAddressAsync(orderInput.Address);
        existingOrder.Address = updatedAddress;

        // Mise à jour du type de commande si besoin
        if (existingOrder.Type?.Id != orderInput.TypeId)
        {
            var newOrderType = await dbContext.OrderTypes.FirstOrDefaultAsync(ct =>
                ct.Id == orderInput.TypeId
            );
            if (newOrderType == null)
                return NotFound(HardCode.ORDER_TYPE_NOT_FOUND);
            existingOrder.Type = newOrderType;
        }

        if (existingOrder.Status?.Id != orderInput.TypeId)
        {
            var newOrderStatus = await dbContext.OrderStatuses.FirstOrDefaultAsync(ct =>
                ct.Id == orderInput.StatusId
            );
            if (newOrderStatus == null)
                return NotFound(HardCode.ORDER_TYPE_NOT_FOUND);
            existingOrder.Status = newOrderStatus;
        }

        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new OrderOutput(existingOrder));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region GET autocomplete

    /// <summary>
    ///     Méthode de recherche pour l'autocomplétion des commandes
    /// </summary>
    /// <param name="search"></param>
    /// <returns></returns>
    [HttpGet("autocomplete")]
    public ActionResult<List<OrderAutoCompleteOutput>> GetOrderAutocomplete(string search)
    {
        var orders = dbContext
            .Orders.AsNoTracking()
            .Where(c => c.Name.ToLower().Contains(search.ToLower()))
            .Take(10)
            .Select(c => new OrderAutoCompleteOutput(c));

        return Ok(orders);
    }

    #endregion

    #region DELETE Commande

    /// <summary>
    ///     Suppression d'une commande
    /// </summary>
    [HttpDelete("{orderId:guid}")]
    public async Task<IActionResult> DeleteOrder(Guid orderId)
    {
        var order = await dbContext
            .Orders.Where(c => c.Id == orderId)
            .Include(c => c.Address)
            .Include(c => c.Client)
            .Include(c => c.Type)
            .FirstOrDefaultAsync();

        if (order == null)
            return NotFound(HardCode.ORDER_NOT_FOUND);
        var transaction = await dbContext.Database.BeginTransactionAsync();

        try
        {
            //dbContext.Orders.Remove(order);
            order.ArchivedAt = DateTime.UtcNow;
            await dbContext
                .Missions.Where(m => m.OrderId == order.Id)
                .ExecuteUpdateAsync(setters =>
                    setters
                        .SetProperty(m => m.ArchivedAt, DateTime.UtcNow)
                        .SetProperty(m => m.UpdatedAt, DateTime.UtcNow)
                );

            await dbContext.SaveChangesAsync();

            await transaction.CommitAsync();

            return NoContent(); // 204, pas de contenu en retour après suppression
        }
        catch (Exception e)
        {
            transaction.Rollback();
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region UNARCHIVE Commande

    [HttpPost("{id:guid}/unarchive")]
    public async Task<ActionResult> Unarchive(Guid id)
    {
        var order = await dbContext.Orders.FindAsync(id);
        if (order == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        try
        {
            order.ArchivedAt = null;
            dbContext.Orders.Update(order);
            await dbContext.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return StatusCode(500, new { message = $"Erreur interne : {ex.Message}" });
        }
    }

    #endregion

    #region get,  upload  or delete files

    /// <summary>
    ///     Récupère tous les fichiers (documents) d'une mission
    /// </summary>
    [HttpGet("{orderId:guid}/files")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FileInfoResponse>>> GetMissionFiles(Guid orderId)
    {
        var order = await dbContext.Orders.FindAsync(orderId);
        if (order == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var files = await minioService.GetFilesWithMetadata(
            $"{order.MinioFolderName}/{orderId}/files"
        );
        return Ok(files);
    }

    /// <summary>
    ///     Upload un fichier/document pour une mission
    /// </summary>
    [HttpPost("{orderId:guid}/files")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileInfoResponse>> UploadFile(IFormFile file, Guid orderId)
    {
        // Vérification de la mission
        var order = await dbContext.Orders.FindAsync(orderId);
        if (order == null)
            return NotFound(HardCode.ORDER_NOT_FOUND);

        // vérificcation volume
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(HardCode.TOO_BIG_FILE);

        // Vérification du format du document
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (
            !HardCode.AllowedDocumentsMimeTypes.Contains(file.ContentType)
            || !HardCode.AllowedDocumentsExtensions.Contains(fileExtension)
        )
            return BadRequest(HardCode.GENERAL_BAD_FORMAT);

        try
        {
            var guid = Guid.NewGuid();
            var fileName = $"doc_{guid}{Path.GetExtension(file.FileName)}";
            var path = $"{order.MinioFolderName}/{orderId}/files";

            var minioResponse = await minioService.UploadFileAsync(path, fileName, file);
            if (minioResponse.ResponseStatusCode != HttpStatusCode.OK)
                return BadRequest(HardCode.MINIO_FAIL_UPLOAD);

            var url = await minioService.GetFileUrlAsync(minioResponse.ObjectName);

            return Ok(
                new FileInfoResponse
                {
                    Name = fileName,
                    Url = url,
                    UploadDate = DateTimeOffset.UtcNow,
                }
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erreur upload fichier: {ex.Message}");
            return StatusCode(500, "Erreur lors de l'upload du fichier");
        }
    }

    /// <summary>
    ///     Supprime un fichier d'une mission
    /// </summary>
    [HttpDelete("{orderId:guid}/files/{fileName}")]
    public async Task<ActionResult> DeleteFile(Guid orderId, string fileName)
    {
        var mission = await dbContext.Missions.FindAsync(orderId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var files = await minioService.GetFilesWithMetadata(
            $"{mission.MinioFolderName}/{orderId}/files"
        );
        var file = files.FirstOrDefault(f => f.Name == fileName);
        if (file == null)
            return NotFound(HardCode.MINIO_FILE_NOT_FOUND);

        var fileUrl = $"{mission.MinioFolderName}/{orderId}/files/{fileName}";

        await minioService.RemoveFileAsync(fileUrl);
        return Ok();
    }

    #endregion

    #region GET List with clientId

    /// <summary>
    ///     Récupère la liste des commandes avec un clientId
    /// </summary>
    [HttpGet("datagrid/{clientId:guid}")]
    public async Task<ActionResult<ListResponse<OrderListOutput>>> GetListWithClientId(
        Guid clientId,
        ODataQueryOptions<Order> options
    )
    {
        try
        {
            var query = dbContext
                .Orders.Where(o => o.ClientId == clientId)
                .Include(o => o.Missions)
                .ThenInclude(m => m.Status)
                .Include(o => o.Status)
                .Include(o => o.Type)
                .Include(o => o.Client)
                .Include(o => o.Address)
                .AsNoTracking();
            query = options.ApplyAndGetCount(query, out var count);
            var result = query.Select(o => new OrderListOutput(o)).ToList();
            return Ok(new ListResponse<OrderListOutput>(result, count));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion
}
