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

[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
[Authorize]
public class UserAbsencesController(ApplicationDbContext dbContext) : ControllerBase
{
    #region POST - Datagrid user absences with OData filters

    /// <summary>
    /// Récupérer la liste filtrée des absences utilisateur via OData.
    /// </summary>
    /// <returns>Liste paginée d'absences utilisateur</returns>
    [HttpPost("datagrid")]
    public ActionResult<ListResponse<UserAbsenceOutput>> GetUserAbsencesDatagrid(
        ODataQueryOptions<UserAbsence> options, Guid? userId)
    {
        try
        {
            // 1. Construire la requête de base
            IQueryable<UserAbsence> query = dbContext
                .UserAbsences
                .Include(a => a.Type)
                .Include(a => a.User)
                .AsNoTracking();

            if (userId is not null)
            {
                query = query.Where(x => x.UserId == userId);
            }

            // 2. Appliquer le search simple (si besoin)
            if (options.Search?.RawValue != null)
            {
                query = query.Where(a =>
                    a.Comments != null && a.Comments.ToLower().Contains(options.Search.RawValue.ToLower())
                );
            }

            // 3. Appliquer les options OData ($filter, $orderby, $top, $skip)
            query = options.ApplyAndGetCount(query, out var count);

            // 4. Retourner la réponse formatée
            var result = query.Select(a => new UserAbsenceOutput(a)).ToList();
            return Ok(new ListResponse<UserAbsenceOutput>(result, count));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, HardCode.GENERAL_ERROR);
        }
    }

    #endregion

    #region GET absence details

    /// <summary>
    /// Récupérer les détails d'une absence utilisateur par son identifiant.
    /// </summary>
    /// <param name="userId">Identifiant unique de l'absence</param>
    /// <returns>Détails de l'absence</returns>
    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserAbsenceOutput>> GetById(Guid userId)
    {
        var absence = await dbContext
            .UserAbsences
            .Where(a => a.Id == userId)
            .Include(a => a.Type)
            .Include(a => a.User)
            .FirstOrDefaultAsync();

        if (absence == null)
            return NotFound(HardCode.ABSENCE_NOT_FOUND);

        return Ok(new UserAbsenceOutput(absence));
    }

    #endregion

    #region POST create absence

    /// <summary>
    /// Créer une nouvelle absence utilisateur.
    /// </summary>
    /// <param name="userAbsenceInput">Données de l'absence à créer</param>
    /// <returns>Identifiant de la nouvelle absence</returns>
    [HttpPost]
    public async Task<ActionResult<Guid>> Create([FromBody] UserAbsenceInput userAbsenceInput)
    {
        try
        {
            // Vérifier que le type d'absence existe
            var absenceType = await dbContext.AbsenceTypes.FindAsync(userAbsenceInput.TypeId);
            if (absenceType == null)
                return NotFound(HardCode.ABSENCE_TYPE_NOT_FOUND);

            // Vérifier que l'utilisateur existe
            var user = await dbContext.Users.FindAsync(userAbsenceInput.UserId);
            if (user == null)
                return NotFound(HardCode.USER_NOT_FOUND);

            var id = Guid.NewGuid();
            var absence = new UserAbsence
            {
                Id = id,
                TypeId = userAbsenceInput.TypeId,
                UserId = userAbsenceInput.UserId,
                StartDate = userAbsenceInput.StartDate,
                EndDate = userAbsenceInput.EndDate,
                Comments = userAbsenceInput.Comments,
                FileName = $"absence-{id}",  // Valeur par défaut pour BaseFile
                Url = string.Empty  // Valeur par défaut pour BaseFile
            };

            dbContext.UserAbsences.Add(absence);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = absence.Id }, absence.Id);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, HardCode.ABSENCE_ERROR_CREATE);
        }
    }

    #endregion

    #region PUT update absence

    /// <summary>
    /// Mettre à jour une absence utilisateur existante.
    /// </summary>
    /// <param name="userId">Identifiant de l'absence à mettre à jour</param>
    /// <param name="userAbsenceInput">Nouvelles données de l'absence</param>
    /// <returns>Détails de l'absence mise à jour</returns>
    [HttpPut("{userId:guid}")]
    public async Task<ActionResult<UserAbsenceOutput>> Update(Guid userId, [FromBody] UserAbsenceInput userAbsenceInput)
    {
        try
        {
            var absence = await dbContext
                .UserAbsences
                .Where(a => a.Id == userId)
                .Include(a => a.Type)
                .Include(a => a.User)
                .FirstOrDefaultAsync();

            if (absence == null)
                return NotFound(HardCode.ABSENCE_NOT_FOUND);

            // Vérifier que le type d'absence existe si modifié
            if (absence.TypeId != userAbsenceInput.TypeId)
            {
                var absenceType = await dbContext.AbsenceTypes.FindAsync(userAbsenceInput.TypeId);
                if (absenceType == null)
                    return NotFound(HardCode.ABSENCE_TYPE_NOT_FOUND);
            }

            absence.TypeId = userAbsenceInput.TypeId;
            absence.StartDate = userAbsenceInput.StartDate;
            absence.EndDate = userAbsenceInput.EndDate;
            absence.Comments = userAbsenceInput.Comments;

            await dbContext.SaveChangesAsync();
            return Ok(new UserAbsenceOutput(absence));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, HardCode.ABSENCE_ERROR_UPDATE);
        }
    }

    #endregion

    #region DELETE absence

    /// <summary>
    /// Supprimer une absence utilisateur.
    /// </summary>
    /// <param name="userId">Identifiant de l'absence à supprimer</param>
    /// <returns>Identifiant de l'absence supprimée</returns>
    [HttpDelete("{userId:guid}")]
    public async Task<ActionResult<Guid>> Delete(Guid userId)
    {
        try
        {
            var absence = await dbContext.UserAbsences.FindAsync(userId);
            if (absence == null)
                return NotFound(HardCode.ABSENCE_NOT_FOUND);

            //dbContext.UserAbsences.Remove(absence);
            absence.ArchivedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
            return Ok(userId);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, HardCode.ABSENCE_ERROR_DELETE);
        }
    }

    #endregion

    #region GET absences by user

    /// <summary>
    /// Récupérer toutes les absences d'un utilisateur.
    /// </summary>
    /// <param name="userId">Identifiant de l'utilisateur</param>
    /// <returns>Liste des absences de l'utilisateur</returns>
    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<List<UserAbsenceOutput>>> GetAbsencesByUser(Guid userId)
    {
        var user = await dbContext.Users.FindAsync(userId);
        if (user == null)
            return NotFound(HardCode.USER_NOT_FOUND);

        var absences = await dbContext
            .UserAbsences
            .Include(a => a.User)
            .Where(a => a.UserId == userId)
            .Include(a => a.Type)
            .OrderByDescending(a => a.StartDate)
            .AsNoTracking()
            .ToListAsync();

        return Ok(absences.Select(a => new UserAbsenceOutput(a)).ToList());
    }

    #endregion
}


