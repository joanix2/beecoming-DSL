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
///     Gestion des utilisateurs
/// </summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[Consumes("application/json")]
[Authorize]
public class ClientsController(
    ApplicationDbContext dbContext,
    IEmailService emailService,
    AddressService addressService
) : ControllerBase
{
    #region GET Client List

    /// <summary>
    ///     Récupérer la liste des clients avec filtres dynamiques OData
    /// </summary>
    /// <returns></returns>
    [HttpPost("datagrid")]
    [AllowAnonymous]
    public ActionResult<ListResponse<ClientListOutput>> GetClientList(
        ODataQueryOptions<Client> options
    )
    {
        try
        {
            var clientsWithLastOrder = dbContext
                .Clients.Select(c => new Client
                {
                    Id = c.Id,
                    ContactName = c.ContactName,
                    Email = c.Email,
                    CreatedAt = c.CreatedAt,
                    Company = c.Company,
                    PhoneNumber = c.PhoneNumber,
                    Orders = c.Orders.OrderByDescending(cmd => cmd.CreatedAt).Take(1).ToList()
                })
                .AsNoTracking();

            if (options.Search?.RawValue != null)
            {
                var search = options.Search.RawValue.ToLower();
                clientsWithLastOrder = clientsWithLastOrder.Where(u =>
                    EF.Functions.ILike(u.Company.ToLower(), $"%{search}%")
                    || EF.Functions.ILike(u.ContactName, $"%{search}%")
                    || (u.Email ?? string.Empty).ToLower().Contains(search)
                );
            }

            clientsWithLastOrder = options.ApplyAndGetCount(clientsWithLastOrder, out var count);

            return Ok(
                new ListResponse<ClientListOutput>(
                    clientsWithLastOrder.Select(c => new ClientListOutput(c)),
                    count
                )
            );
        }
        catch (Exception e)
        {
            Console.WriteLine("Erreur GetClientList : " + e);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region GET Client Details

    /// <summary>
    ///     Récupérer les détails d'un client
    /// </summary>
    /// <returns></returns>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientOutput>> GetClientDetail(Guid id)
    {
        var client = await dbContext
            .Clients.Where(c => c.Id == id)
            .Include(c => c.Address)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (client == null)
            return NotFound(HardCode.CLIENT_NOT_FOUND);
        return new ClientOutput(client);
    }

    #endregion

    #region POST Create client

    /// <summary>
    ///     Inscription d'un client
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Guid>> CreateClient([FromBody] ClientInput clientInput)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Création du client à partir de l’input
        var client = new Client(clientInput);

        // Utilisation du service pour créer ou mettre à jour l’adresse
        var address = await addressService.CreateOrUpdateAddressAsync(clientInput.Address);
        client.Address = address;

        dbContext.Clients.Add(client);
        await dbContext.SaveChangesAsync();

        return Ok(client.Id);
    }

    #endregion

    #region PUT Update Client

    /// <summary>
    ///     Modification d'un client
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClientOutput>> UpdateClient(
        Guid id,
        [FromBody] ClientInput clientInput
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existingClient = await dbContext
            .Clients.Where(u => u.Id == id)
            .Include(c => c.Address)
            .FirstOrDefaultAsync();

        if (existingClient == null)
            return NotFound(HardCode.CLIENT_NOT_FOUND);

        // Mise à jour des champs du client
        existingClient.ContactName = clientInput.ContactName;
        existingClient.Email = clientInput.Email;
        existingClient.PhoneNumber = clientInput.PhoneNumber;
        existingClient.Company = clientInput.Company;
        existingClient.ArchivedAt = clientInput.ArchivedAt;

        // Mise à jour ou création de l'adresse via le service
        var address = await addressService.CreateOrUpdateAddressAsync(clientInput.Address);
        existingClient.Address = address;

        await dbContext.SaveChangesAsync();

        return Ok(new ClientOutput(existingClient));
    }

    #endregion

    #region DELETE Client

    /// <summary>
    ///     Suppression d'un client
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteClient(Guid id)
    {
        var client = await dbContext.Clients.FirstOrDefaultAsync(u => u.Id == id);

        if (client == null)
            return NotFound(HardCode.CLIENT_NOT_FOUND);

        try
        {
            //dbContext.Clients.Remove(client);
            client.ArchivedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
            return NoContent(); // 204 : suppression réussie sans contenu de retour
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new { message = $"Erreur interne : {e.Message}" });
        }
    }

    #endregion

    #region GET Client AutoComplete

    /// <summary>
    ///     Récupérer les clients par rapport à l'autocomplétion
    /// </summary>
    /// <param name="search"></param>
    [HttpGet("autocomplete")]
    public ActionResult<List<ClientAutoCompleteOutput>> GetClientAutoComplete(
        [FromQuery] string? search
    )
    {
        if (search == null)
            return Ok(
                dbContext
                    .Clients.AsNoTracking()
                    .Select(u => new ClientAutoCompleteOutput(u))
                    .ToList()
            );

        var clients = dbContext
            .Clients.AsNoTracking()
            .Where(u =>
                EF.Functions.ILike(u.Company.ToLower(), $"%{search}%")
                || EF.Functions.ILike(u.ContactName, $"%{search}%")
                || (u.Email ?? string.Empty).ToLower().Contains(search)
            )
            .Select(u => new ClientAutoCompleteOutput(u))
            .ToList();
        return Ok(clients);
    }

    #endregion
}