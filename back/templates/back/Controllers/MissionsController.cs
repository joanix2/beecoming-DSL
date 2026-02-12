using System;
using System.Globalization;
using System.Net;
using api.Models;
using api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.VisualBasic;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Services;
using opteeam_api.Utils;

namespace opteeam_api.Controllers;

[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
[Route("[controller]")]
[Authorize]
public class MissionsController(
    ApplicationDbContext dbContext,
    AddressService addressService,
    IWebHostEnvironment _env,
    MinioService minioService,
    UserManager<ApplicationUser> userManager
) : ControllerBase
{
    private readonly IFormatProvider culture = new CultureInfo("fr-FR", true);

    #region GET List

    /// <summary>
    ///     Récupérer la liste filtrée des missions via OData dans un POST (évite la limite de longueur d'URL).
    /// </summary>
    /// <returns>Liste paginée de missions</returns>
    [HttpGet("datagrid")]
    public async Task<ActionResult<ListResponse<MissionListOutput>>> GetMissionsDatagrid(
        ODataQueryOptions<Mission> options,
        Guid? orderId,
        Guid? userId
    )
    {
        try
        {
            // 1. Générer les options OData à partir du FilterPost
            //options = filter.GenerateOptions(HttpContext);

            // 2. Construire la requête de base
            var query = dbContext
                .Missions
                //.AsSingleQuery()
                .Include(m => m.Type)
                .Include(m => m.Status)
                .Include(m => m.Address)
                .Include(x => x.Status)
                .Include(x => x.Type)
                .Include(x => x.Order)
                .ThenInclude(c => c.Client)
                .Include(m => m.MissionDocuments)
                //.Include(m => m.AffectatedMissionXTeamLeaders.OrderBy(tl => tl.AssignedAt))
                //.ThenInclude(aff => aff.TeamLeader)
                .Include(m => m.MainTeamLeader)
                .AsNoTracking();

            if (orderId is not null)
                query = query.Where(x => x.OrderId == orderId);

            // 3. Appliquer le search simple (si besoin)
            if (options.Search?.RawValue != null)
            {
                var search = options.Search.RawValue.ToLower();
                query = query.Where(m => m.Id.ToString().ToLower().Contains(search));
            }

            // 4. Appliquer les options OData ($filter, $orderby, $top, $skip)
            query = options.ApplyAndGetCount(query, out var count);

            // 5. Retourner la réponse formatée
            var result = query
                .Select(m => new MissionOutput(m, m.AffectatedMissionXTeamLeaders.FirstOrDefault()))
                .ToList();
            return Ok(new ListResponse<MissionOutput>(result, count));
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, HardCode.MISSION_ERROR_GET_LIST);
        }
    }

    /// <summary>
    ///     Récupérer la liste filtrée des missions via OData dans un POST (évite la limite de longueur d'URL).
    /// </summary>
    /// <returns>Liste paginée de missions</returns>
    [HttpGet("unaffected")]
    public async Task<ActionResult<List<MissionOutput>>> GetMissionsUnaffected(
        DateTimeOffset dateFrom,
        DateTimeOffset? dateTo
    )
    {
        DateTimeOffset endOfTheDay = dateFrom.AddDays(1).AddSeconds(-1);

        try
        {
            var query = dbContext
                .Missions.Include(m => m.Type)
                .Include(m => m.Status)
                .Include(x => x.Type)
                .Include(m => m.Address)
                .Include(x => x.Order)
                .ThenInclude(c => c.Client)
                .Include(m => m.AffectatedMissionXTeamLeaders)
                .AsNoTracking();

            if (dateTo is null)
            {
                var missions = await query
                    .Where(m =>
                        m.DateFrom < endOfTheDay
                        && m.DateTo > dateFrom
                        && !m.AffectatedMissionXTeamLeaders.Any(a =>
                            a.TeamLeaderId != null
                            && a.AssignedAt >= dateFrom
                            && a.AssignedAt < endOfTheDay
                        )
                    )
                    .ToListAsync();

                var result = missions
                    .Select(m => new MissionOutput(m, affectationMissionXTeamLeader: null))
                    .ToList();
                return Ok(result);
            }
            else
            {
                var daysOfMissions = new List<DateTimeOffset>();
                for (
                    var i = dateFrom.AddMinutes(dateFrom.TotalOffsetMinutes).Date;
                    i < dateTo.Value.AddMinutes(dateFrom.TotalOffsetMinutes).Date;
                    i = i.AddDays(1)
                )
                {
                    if (i.DayOfWeek != DayOfWeek.Saturday && i.DayOfWeek != DayOfWeek.Sunday)
                    {
                        var dayInUtc = new DateTimeOffset(i, dateFrom.Offset).UtcDateTime;
                        daysOfMissions.Add(dayInUtc);
                    }
                }

                var missionsInPeriod = await query
                    .Where(m =>
                        m.DateFrom < dateTo
                        && m.DateTo > dateFrom
                        && !daysOfMissions.All(dayUtc =>
                            m.AffectatedMissionXTeamLeaders.Any(aff =>
                                aff.TeamLeaderId != null && aff.AssignedAt.Date == dayUtc.Date
                            )
                        )
                    )
                    .ToListAsync();

                var result = missionsInPeriod
                    .Select(m => new MissionOutput(m, m.AffectatedMissionXTeamLeaders.ToList()))
                    .ToList();
                return Ok(result);
            }
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, HardCode.MISSION_ERROR_GET_LIST);
        }
    }

    #endregion

    #region Get order Adresses

    [HttpPost("addresses")]
    public async Task<ActionResult<ListResponse<AddressOutput>>> GetAddressesFiltered(
        ODataQueryOptions<Mission> options,
        Guid? orderId,
        Guid? userId
    )
    {
        var settings = new ODataQuerySettings { PageSize = null };

        var query = dbContext
            .Missions.Include(m => m.Type)
            .Include(m => m.Status)
            .Include(m => m.Address)
            .Include(x => x.Status)
            .Include(x => x.Type)
            .Include(x => x.Order)
            .ThenInclude(c => c.Client)
            .Include(m => m.MissionDocuments)
            .AsNoTracking();

        if (orderId is not null)
            query = query.Where(x => x.OrderId == orderId);

        //if (userId is not null)
        //    query = query.Where(x => x.TeamLeader.Id == userId);

        // je ne prends pas en compte les sort .....
        if (options.Filter != null)
            query = (IQueryable<Mission>)options.Filter.ApplyTo(query, settings);

        // 3. Appliquer le search simple (si besoin)
        if (options.Search?.RawValue != null)
        {
            var search = options.Search.RawValue.ToLower();
            query = query.Where(c =>
                (
                    c.Order.Client != null
                    && EF.Functions.ILike(c.Order.Client.ContactName, $"%{search}%")
                ) || EF.Functions.ILike(c.Order.Client.ContactName, $"%{search}%")
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

    #region GET mission details

    /// <summary>
    ///     Récupérer les détails d'une mission par son identifiant.
    /// </summary>
    /// <param name="id">Identifiant unique de la mission</param>
    /// <returns>Détails de la mission</returns>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MissionOutput>> GetById(Guid id)
    {
        var mission = await dbContext
            .Missions.Where(m => m.Id == id)
            .Include(m => m.Type)
            .Include(m => m.Status)
            .Include(m => m.MainTeamLeader)
            .Include(m => m.Address)
            .Include(m => m.Order)
            .ThenInclude(x => x.Client)
            .Include(m => m.CustomFormResponses)
            .ThenInclude(cfr => cfr.CustomForm)
            .Include(m => m.MissionPhotos)
            .Include(m => m.MissionDocuments)
            .ThenInclude(md => md.Type)
            .Include(m => m.AffectatedMissionXTeamLeaders)
            .ThenInclude(aff => aff.TeamLeader)
            .FirstOrDefaultAsync();

        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        if (mission.MissionPhotos is not null && mission.MissionPhotos.Count > 0)
            foreach (var photo in mission.MissionPhotos)
                photo.Url = await minioService.GetFileUrlAsync(photo.Url);

        if (mission.MissionDocuments is not null && mission.MissionDocuments.Count > 0)
        {
            foreach (var document in mission.MissionDocuments)
                document.Url = await minioService.GetFileUrlAsync(document.Url);
            mission.MissionDocuments = mission
                .MissionDocuments.OrderBy(x => x.FileName)
                .ThenByDescending(x => x.CreatedAt)
                .ToList();
        }

        return Ok(new MissionOutput(mission));
    }

    #endregion

    #region POST create mission

    [HttpPost]
    public async Task<ActionResult<Guid>> Create([FromBody] MissionInput missionInput)
    {
        // Validation du modèle
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        Address? address = null;

        // Cas 1: Une adresse est fournie directement
        if (missionInput.Address is not null)
        {
            address = await addressService.CreateOrUpdateAddressAsync(missionInput.Address);
        }
        // Cas 2: Pas d'adresse fournie, mais un OrderId est spécifié
        else if (missionInput.OrderId is not null)
        {
            var order = await dbContext
                .Orders.Where(x => x.Id == missionInput.OrderId)
                .Include(x => x.Address)
                .FirstOrDefaultAsync();

            if (order?.Address == null)
                return BadRequest("ORDER_NOT_FOUND_OR_NO_ADDRESS");

            address = order.Address;
        }
        // Cas 3: Ni adresse ni OrderId - erreur car une adresse est requise
        else
        {
            return BadRequest("ADDRESS_OR_ORDER_REQUIRED");
        }

        try
        {
            // note : à la création , la date de fin est minuit, j'ai rajoute 1 journée - 1 seconde, pour include la journée de travail
            missionInput.DateFrom = missionInput.DateFrom;
            missionInput.DateTo = missionInput.DateTo.AddDays(1).AddSeconds(-1);
            var mission = new Mission(missionInput, dbContext, address);
            dbContext.Missions.Add(mission);

            // Récupérer le MissionType avec ses CustomForm pour créer les CustomFormResponse vides
            var missionType = await dbContext
                .MissionTypes.Include(mt => mt.CustomForms)
                .FirstOrDefaultAsync(mt => mt.Id == missionInput.TypeId);

            if (missionType?.CustomForms != null && missionType.CustomForms.Any())
                foreach (var customForm in missionType.CustomForms)
                {
                    var customFormResponse = new CustomFormResponse
                    {
                        Id = Guid.NewGuid(),
                        CustomFormId = customForm.Id,
                        MissionId = mission.Id,
                        Data = customForm.Structure.GenerateDefaultCustomFormData(),
                    };

                    dbContext.CustomFormResponses.Add(customFormResponse);
                }

            await dbContext.SaveChangesAsync();
            // ajouter les affectations
            if (missionInput.TeamLeaderId is not null)
            {
                // ajouter des nouvelles
                List<AffectationMissionXTeamLeader> newAffectations = new();
                for (
                    DateTimeOffset date =
                        missionInput.DateFrom > DateTimeOffset.UtcNow
                            ? missionInput.DateFrom
                            : DateTimeOffset.UtcNow.Date;
                    date <= missionInput.DateTo;
                    date = date.AddDays(1)
                )
                {
                    var affectation = new AffectationMissionXTeamLeader
                    {
                        AssignedAt = date,
                        IsHidden = false,
                        TeamLeaderId = missionInput.TeamLeaderId,
                        MissionId = mission.Id,
                        OrderIndex = 0,
                    };
                    newAffectations.Add(affectation);
                }
                dbContext.AddRange(newAffectations);
            }
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = mission.Id }, mission.Id);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return StatusCode(500, new { message = $"Erreur interne : {ex.Message}" });
        }
    }

    #endregion
    #region get missions with affectations
    [HttpGet("missions-detailed")]
    [AllowAnonymous]
    public async Task<ActionResult<List<MissionOutput>>> GetMissionsDetailed(
        DateTimeOffset dateFrom,
        DateTimeOffset? dateTo,
        bool includeFinished = false
    )
    {
        //var offset = dateFrom.Offset;
        DateTimeOffset startDate = dateFrom.ToUniversalTime();
        DateTimeOffset endDate = dateTo.Value.AddSeconds(-1);
        try
        {
            Guid finishedStatusId = Guid.Parse(MissionStatusIdEnum.MISSION_FINISHED_ID);

            var missionsQuery = dbContext.Missions.Where(m =>
                m.DateFrom < endDate && m.DateTo > startDate
            );

            if (!includeFinished)
            {
                missionsQuery = missionsQuery.Where(m => m.StatusId != finishedStatusId);
            }

            var missions = await missionsQuery
                //dbContext
                //.Missions.Where(m => m.DateFrom < endDate && m.DateTo > startDate  )
                .Include(m => m.Status)
                .Include(m => m.Type)
                .Include(m => m.Address)
                .Include(m => m.Order)
                .ThenInclude(o => o.Client)
                .Include(m => m.AffectatedMissionXTeamLeaders.OrderBy(aff => aff.OrderIndex))
                .Select(m => new MissionOutput(
                    m,
                    m.AffectatedMissionXTeamLeaders.Where(aff =>
                            aff.AssignedAt >= startDate && aff.AssignedAt < endDate
                        )
                        .ToList()
                ))
                .ToListAsync();

            return Ok(missions);
        }
        catch
        {
            return BadRequest(HardCode.GENERAL_ERROR);
        }
    }
    #endregion

    #region PUT update mission

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MissionOutput>> Update(
        Guid id,
        [FromBody] MissionInput missionInput
    )
    {
        var offset = missionInput.DateFrom.Offset;
        //missionInput.DateFrom = missionInput.DateFrom.Date.ToUniversalTime();
        var dateNow = new DateTimeOffset(DateTime.UtcNow, offset).Date.ToUniversalTime();
        var transaction = await dbContext.Database.BeginTransactionAsync();
        try
        {
            var mission = await dbContext
                .Missions.Where(m => m.Id == id)
                .Include(m => m.Address)
                .Include(x => x.Order)
                .ThenInclude(x => x.Client)
                .Include(m => m.Type)
                .Include(m => m.Status)
                .Include(m => m.CustomFormResponses)
                .ThenInclude(cfr => cfr.CustomForm)
                .Include(m => m.MainTeamLeader)
                .FirstOrDefaultAsync();

            if (mission == null)
                return NotFound(HardCode.MISSION_NOT_FOUND);

            if (missionInput.Address != null)
            {
                if (mission.Address == null)
                    mission.Address = new Address(missionInput.Address);
                else
                    mission.Address.Update(missionInput.Address);
            }

            // cas où on modifie les dates de début et fin
            if (mission.DateFrom != missionInput.DateFrom || mission.DateTo != missionInput.DateTo)
            {
                // securité : cas où la date de but est inferieure à la date d'aujourd'hui => rollback
                if (
                    missionInput.DateFrom != mission.DateFrom
                    && missionInput.DateFrom < DateTimeOffset.UtcNow.Date
                )
                {
                    await transaction.RollbackAsync();
                    return BadRequest(HardCode.MISSION_CANNOT_UPDATE_TO_PASSED_DATE);
                }
                // supprimer les affectations qui ne sont plus incluses

                int count = await dbContext
                    .AffectationMissionXTeamLeaders.Where(x =>
                        x.MissionId == mission.Id
                        && (
                            x.AssignedAt > missionInput.DateTo // affectations dépassant
                            || (
                                x.AssignedAt < missionInput.DateFrom
                                && x.AssignedAt >= DateTimeOffset.UtcNow.Date
                            )
                        )
                    )
                    .ExecuteUpdateAsync(m =>
                        m.SetProperty(mi => mi.ArchivedAt, DateTimeOffset.UtcNow)
                            .SetProperty(mi => mi.UpdatedAt, DateTimeOffset.UtcNow)
                    );

                // ajouter des nouvelles affectations dans la période qui déborde
                // après
                if (missionInput.DateTo > mission.DateTo)
                {
                    for (
                        DateTimeOffset date = mission.DateTo.AddSeconds(1);
                        date <= missionInput.DateTo;
                        date = date.AddDays(1)
                    )
                    {
                        var affectation = new AffectationMissionXTeamLeader
                        {
                            AssignedAt = date,
                            IsHidden = mission.IsHidden,
                            TeamLeaderId = missionInput.TeamLeaderId,
                            MissionId = mission.Id,
                            OrderIndex = 0,
                        };
                        dbContext.Add(affectation);
                    }
                } // avant
                if (missionInput.DateFrom < mission.DateFrom)
                {
                    for (
                        DateTimeOffset date = missionInput.DateFrom;
                        date < mission.DateFrom;
                        date = date.AddDays(1)
                    )
                    {
                        var affectation = new AffectationMissionXTeamLeader
                        {
                            AssignedAt = date,
                            IsHidden = mission.IsHidden,
                            TeamLeaderId = missionInput.TeamLeaderId,
                            MissionId = mission.Id,
                            OrderIndex = 0,
                        };
                        dbContext.Add(affectation);
                    }
                }
            }

            // cas où on change le teamleader
            // ajouter les affectations
            if (
                missionInput.TeamLeaderId is not null
                && missionInput.TeamLeaderId != mission.TeamLeaderId
            )
            {
                // supprimer les anciennes affectations
                await dbContext
                    .AffectationMissionXTeamLeaders.Where(x =>
                        x.MissionId == mission.Id && x.AssignedAt >= DateTimeOffset.UtcNow.Date
                    )
                    .ExecuteUpdateAsync(m =>
                        m.SetProperty(mi => mi.ArchivedAt, DateTimeOffset.UtcNow)
                            .SetProperty(mi => mi.UpdatedAt, DateTimeOffset.UtcNow)
                    );
                // ajouter des nouvelles
                List<AffectationMissionXTeamLeader> newAffectations = new();
                for (
                    DateTimeOffset date =
                        missionInput.DateFrom > DateTimeOffset.UtcNow
                            ? missionInput.DateFrom
                            : DateTimeOffset.UtcNow.Date;
                    date <= missionInput.DateTo;
                    date = date.AddDays(1)
                )
                {
                    var affectation = new AffectationMissionXTeamLeader
                    {
                        AssignedAt = date,
                        IsHidden = false,
                        TeamLeaderId = missionInput.TeamLeaderId,
                        MissionId = mission.Id,
                        OrderIndex = 0,
                    };
                    newAffectations.Add(affectation);
                }
                dbContext.AddRange(newAffectations);
            }
            else if (mission.TeamLeaderId is not null && missionInput.TeamLeaderId is null)
            {
                // supprimer les anciennes affectations
                await dbContext
                    .AffectationMissionXTeamLeaders.Where(x =>
                        x.MissionId == mission.Id && x.AssignedAt >= DateTimeOffset.UtcNow.Date
                    )
                    .ExecuteUpdateAsync(m =>
                        m.SetProperty(mi => mi.ArchivedAt, DateTimeOffset.UtcNow)
                            .SetProperty(mi => mi.UpdatedAt, DateTimeOffset.UtcNow)
                    );
            }
            mission.TeamLeaderId = missionInput.TeamLeaderId;

            // Traiter les nouvelles réponses des CustomForm si fournies
            if (missionInput.CustomFormResponses != null && missionInput.CustomFormResponses.Any())
                foreach (var customFormResponseInput in missionInput.CustomFormResponses)
                {
                    var existingResponse = await dbContext.CustomFormResponses.FirstOrDefaultAsync(
                        cfr =>
                            cfr.MissionId == id
                            && cfr.CustomFormId == customFormResponseInput.CustomFormId
                    );

                    if (existingResponse != null)
                    {
                        // Mettre à jour les données existantes
                        existingResponse.Data = customFormResponseInput.Data;
                        dbContext.CustomFormResponses.Update(existingResponse);
                    }
                    else
                    {
                        // Créer une nouvelle CustomFormResponse si elle n'existe pas
                        var newCustomFormResponse = new CustomFormResponse
                        {
                            Id = Guid.NewGuid(),
                            CustomFormId = customFormResponseInput.CustomFormId,
                            MissionId = id,
                            Data = customFormResponseInput.Data,
                        };
                        dbContext.CustomFormResponses.Add(newCustomFormResponse);
                    }
                }

            // Synchroniser les CustomFormResponse avec le MissionType
            await SynchronizeCustomFormResponsesAsync(mission.Id, missionInput.TypeId);
            // update basic
            mission.TypeId = missionInput.TypeId;
            mission.StatusId = missionInput.StatusId;
            mission.DateFrom = missionInput.DateFrom;
            mission.DateTo =
                mission.DateTo != missionInput.DateTo
                    ? missionInput.DateTo.AddDays(1).AddSeconds(-1)
                    : mission.DateTo;
            mission.InternalComments = missionInput.InternalComments;
            mission.Comments = missionInput.Comments;
            mission.Name = missionInput.Name;

            await dbContext.SaveChangesAsync();

            // Recharger la mission avec toutes les données mises à jour
            var updatedMission = await dbContext
                .Missions.Where(m => m.Id == id)
                .Include(m => m.Type)
                .Include(m => m.Status)
                .Include(m => m.MainTeamLeader)
                .Include(m => m.Address)
                .Include(m => m.Order)
                .ThenInclude(x => x.Client)
                .Include(m => m.CustomFormResponses)
                .ThenInclude(cfr => cfr.CustomForm)
                .Include(m => m.MissionPhotos)
                .Include(m => m.MissionDocuments)
                .ThenInclude(md => md.Type)
                .FirstOrDefaultAsync();
            await transaction.CommitAsync();

            return Ok(new MissionOutput(updatedMission!));
        }
        catch
        {
            await transaction.RollbackAsync();
            return BadRequest(HardCode.GENERAL_ERROR);
        }
    }

    [HttpPut("assign")]
    public async Task<ActionResult<MissionOutput>> AssignMission(
        Guid missionId,
        Guid teamleaderId,
        DateTimeOffset dateFrom,
        short orderIndex
    )
    {
        if (dateFrom < DateTimeOffset.UtcNow.Date)
        {
            return BadRequest(HardCode.MISSION_CANNOT_UAFFECT_PASSED_DAYS);
        }
        var localStart = new DateTimeOffset(dateFrom.Date, dateFrom.Offset);
        var startOfDayUtc = localStart.UtcDateTime;
        var todayDate = DateTimeOffset.UtcNow.Date;

        var mission = await dbContext.Missions.FirstOrDefaultAsync(x => x.Id == missionId);
        if (mission is null)
        {
            return BadRequest(HardCode.MISSION_NOT_FOUND);
        }

        using (IDbContextTransaction transaction = await dbContext.Database.BeginTransactionAsync())
        {
            try
            {
                // je vérifie si le user est teamleader
                var roleId = await dbContext
                    .Roles.Where(r => r.Name == HardCode.TEAMLEADER_LABEL)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();
                var user = await dbContext
                    .Users.AsNoTracking()
                    .Where(u => u.Id == teamleaderId)
                    .Where(u =>
                        dbContext.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == roleId)
                    )
                    .FirstOrDefaultAsync();

                if (user is null)
                {
                    return BadRequest(HardCode.GENERAL_ERROR);
                }

                // cas où l'affectation depasse la date originale de la mission 
                if(dateFrom > mission.DateTo)
                {
                    mission.DateTo = dateFrom.AddDays(1).AddSeconds(-1);
                }
                if (dateFrom < mission.DateFrom )
                {
                    if(dateFrom < todayDate)
                    {
                        return BadRequest(HardCode.MISSION_CANNOT_UPDATE_TO_PASSED_DATE);
                    }
                    mission.DateFrom = dateFrom;
                }
                // je supprime l'ancienne affectation qà la meme date
                var countRemoved = await dbContext
                    .AffectationMissionXTeamLeaders.Where(aff =>
                        aff.MissionId == missionId && aff.AssignedAt == startOfDayUtc
                    )
                    .ExecuteUpdateAsync(
                        (m) =>
                            m.SetProperty(mi => mi.ArchivedAt, DateTimeOffset.UtcNow)
                                .SetProperty(mi => mi.UpdatedAt, DateTimeOffset.UtcNow)
                    );
                await dbContext.SaveChangesAsync();
                // to do envoyer une notif au future teamleader
                var affectation = new AffectationMissionXTeamLeader
                {
                    Id = Guid.NewGuid(),
                    MissionId = missionId,
                    TeamLeaderId = teamleaderId,
                    AssignedAt = startOfDayUtc,
                    CreatedAt = DateTime.UtcNow,
                    IsHidden = mission.IsHidden,
                    OrderIndex = orderIndex,
                };
                // cas où je change l'ordre d'affichage
                // Get all existing affectations for the same teamleader and date BEFORE adding the new one
                var similarAffectations = await dbContext
                    .AffectationMissionXTeamLeaders.Where(x =>
                        x.TeamLeaderId == teamleaderId && x.AssignedAt == startOfDayUtc
                    )
                    .Include(aff => aff.TeamLeader)
                    .ToListAsync();

                // Shift indexes: increment OrderIndex for affectations with OrderIndex >= orderIndex
                foreach (
                    var existingAffectation in similarAffectations.Where(a =>
                        a.OrderIndex >= orderIndex
                    )
                )
                {
                    existingAffectation.OrderIndex++;
                }

                // Now add the new affectation with the specified orderIndex
                await dbContext.AffectationMissionXTeamLeaders.AddAsync(affectation);
                await dbContext.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new MissionOutput(mission, affectation));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(HardCode.GENERAL_ERROR);
            }
        }
    }

    [HttpPut("re-arrang")]
    public async Task<ActionResult<string>> ArrangeMission(Guid affectationId, short orderIndex)
    {
        using (IDbContextTransaction transaction = await dbContext.Database.BeginTransactionAsync())
        {
            try
            {
                var affectation =
                    await dbContext.AffectationMissionXTeamLeaders.FirstOrDefaultAsync(x =>
                        x.Id == affectationId
                    );

                if (affectation is null)
                {
                    return BadRequest(HardCode.GENERAL_ERROR);
                }

                var similarAffectations = dbContext
                    .AffectationMissionXTeamLeaders.Where(aff =>
                        aff.TeamLeaderId == affectation.TeamLeaderId
                        && aff.AssignedAt == affectation.AssignedAt
                    )
                    .OrderBy(aff => aff.OrderIndex)
                    .ToList();

                // Remove the target affectation from the list temporarily
                var targetAffectation = similarAffectations.First(a => a.Id == affectationId);
                similarAffectations.Remove(targetAffectation);

                // Reorder all affectations: insert the target at the new position
                var reorderedList = new List<AffectationMissionXTeamLeader>();

                for (int i = 0; i < similarAffectations.Count + 1; i++)
                {
                    if (i == orderIndex)
                    {
                        // Insert the target affectation at the desired position
                        reorderedList.Add(targetAffectation);
                    }

                    // Add the remaining affectations (skip if we're at the insertion point)
                    if (i < similarAffectations.Count)
                    {
                        if (i >= orderIndex)
                        {
                            reorderedList.Add(similarAffectations[i]);
                        }
                        else
                        {
                            reorderedList.Add(similarAffectations[i]);
                        }
                    }
                }

                // Update OrderIndex for all affectations based on their new positions
                for (int i = 0; i < reorderedList.Count; i++)
                {
                    reorderedList[i].OrderIndex = (short)i;
                }
                await dbContext.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(affectation.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(HardCode.GENERAL_ERROR);
            }
        }
    }

    [HttpPut("unassign")]
    public async Task<ActionResult<string>> UnassignMission(Guid affectationMissionXTeamleaderId)
    {
        var affectationMission = await dbContext.AffectationMissionXTeamLeaders.FirstOrDefaultAsync(
            x => x.Id == affectationMissionXTeamleaderId
        );
        if (affectationMission is null)
        {
            return BadRequest(HardCode.MISSION_NOT_FOUND);
        }

        if (affectationMission.AssignedAt < DateTimeOffset.UtcNow.Date)
        {
            return BadRequest(HardCode.MISSION_CANNOT_UAFFECT_PASSED_DAYS);
        }

        using (IDbContextTransaction transaction = await dbContext.Database.BeginTransactionAsync())
        {
            try
            {
                await dbContext
                    .AffectationMissionXTeamLeaders.Where(x =>
                        x.Id == affectationMissionXTeamleaderId
                    )
                    .ExecuteUpdateAsync(m =>
                        m.SetProperty(mi => mi.ArchivedAt, DateTimeOffset.UtcNow)
                            .SetProperty(mi => mi.UpdatedAt, DateTimeOffset.UtcNow)
                    );

                await dbContext.SaveChangesAsync();
                // to do envoyer yne notif au future teamleader
                await transaction.CommitAsync();
                return Ok(affectationMission.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(HardCode.GENERAL_ERROR);
            }
        }
    }

    [HttpPut("update-mission-visibility")]
    public async Task<ActionResult<bool>> UpdateVisibility(
        [FromBody] MissionVisibilityDTO missionsDTO
    )
    {
        var mission = dbContext.Missions.FirstOrDefault(x => x.Id == missionsDTO.MissionId);
        if (mission is null)
        {
            return BadRequest(HardCode.GENERAL_ERROR);
        }

        mission.IsHidden = missionsDTO.IsHidden;

        await dbContext.SaveChangesAsync();
        return Ok(mission.IsHidden);
    }

    [HttpPut("update-mission-affectation-visibility")]
    public async Task<ActionResult<bool>> UpdateAffectationVisibility(
        [FromBody] MissionAffectationVisibilityDTO missionsAffectationDTO
    )
    {
        var missionAffectation = dbContext.AffectationMissionXTeamLeaders.FirstOrDefault(x =>
            x.Id == missionsAffectationDTO.MissionAffectationId
        );
        if (missionAffectation is null)
        {
            return BadRequest(HardCode.GENERAL_ERROR);
        }

        missionAffectation.IsHidden = missionsAffectationDTO.IsHidden;

        await dbContext.SaveChangesAsync();
        return Ok(missionAffectation.IsHidden);
    }
    #endregion

    #region Synchronization Helper

    /// <summary>
    ///     Synchronise les CustomFormResponse d'une Mission avec les CustomForm du MissionType.
    ///     Ajoute les CustomFormResponse manquantes si de nouveaux CustomForm ont été ajoutés au MissionType.
    /// </summary>
    /// <param name="missionId">ID de la Mission</param>
    /// <param name="missionTypeId">ID du MissionType</param>
    private async Task SynchronizeCustomFormResponsesAsync(Guid missionId, Guid missionTypeId)
    {
        // Récupérer le MissionType avec ses CustomForm
        var missionType = await dbContext
            .MissionTypes.Include(mt => mt.CustomForms)
            .FirstOrDefaultAsync(mt => mt.Id == missionTypeId);

        if (missionType?.CustomForms == null || !missionType.CustomForms.Any())
            return;

        // Récupérer les CustomFormResponse existantes pour cette Mission
        var existingCustomFormResponseIds = await dbContext
            .CustomFormResponses.Where(cfr => cfr.MissionId == missionId)
            .Select(cfr => cfr.CustomFormId)
            .ToListAsync();

        // Identifier les CustomForm manquantes (qui n'ont pas de CustomFormResponse)
        var missingCustomForms = missionType
            .CustomForms.Where(cf => !existingCustomFormResponseIds.Contains(cf.Id))
            .ToList();

        // Créer les CustomFormResponse manquantes avec des données vides
        foreach (var customForm in missingCustomForms)
        {
            var customFormResponse = new CustomFormResponse
            {
                Id = Guid.NewGuid(),
                CustomFormId = customForm.Id,
                MissionId = missionId,
                Data = customForm.Structure.GenerateDefaultCustomFormData(),
            };

            dbContext.CustomFormResponses.Add(customFormResponse);
        }
    }

    #endregion

    #region DELETE mission

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<Guid>> Delete(Guid id)
    {
        var mission = await dbContext.Missions.FindAsync(id);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        mission.ArchivedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();
        return Ok(id);
    }

    #endregion

    #region UNARCHIVE mission

    [HttpPost("{id:guid}/unarchive")]
    public async Task<ActionResult> Unarchive(Guid id)
    {
        var mission = await dbContext.Missions.FindAsync(id);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        try
        {
            mission.ArchivedAt = null;
            dbContext.Missions.Update(mission);
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

    #region GET Duplicate Mission

    /// <summary>
    ///     Duplique une mission
    /// </summary>
    [HttpGet("{missionId:guid}/duplicate")]
    public async Task<ActionResult<MissionOutput>> Duplicate(Guid missionId)
    {
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var duplicateMission = new Mission(mission, dbContext);
        duplicateMission.Id = Guid.NewGuid();
        duplicateMission.Name = $"Copie de {mission.Name}";
        duplicateMission.ArchivedAt = null;
        duplicateMission.CreatedAt = DateTime.UtcNow;
        duplicateMission.UpdatedAt = null;
        dbContext.Missions.Add(duplicateMission);

        // Récupérer le MissionType avec ses CustomForm pour créer les CustomFormResponse vides
        var missionType = await dbContext
            .MissionTypes.Include(mt => mt.CustomForms)
            .FirstOrDefaultAsync(mt => mt.Id == mission.TypeId);

        if (missionType?.CustomForms != null && missionType.CustomForms.Any())
            foreach (var customForm in missionType.CustomForms)
            {
                var customFormResponse = new CustomFormResponse
                {
                    Id = Guid.NewGuid(),
                    CustomFormId = customForm.Id,
                    MissionId = duplicateMission.Id,
                    Data = customForm.Structure.GenerateDefaultCustomFormData(),
                };

                dbContext.CustomFormResponses.Add(customFormResponse);
            }

        await dbContext.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = duplicateMission.Id },
            duplicateMission.Id
        );
    }

    #endregion

    #region Upload Files & Pictures

    /// <summary>
    ///     Upload une image/photo pour une mission
    /// </summary>
    [HttpPost("{missionId:guid}/pictures")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileInfoResponse>> UploadPicture(IFormFile file, Guid missionId)
    {
        // Vérification de la mission
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        // Vérification du format de l'image
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (
            !HardCode.AllowedImagesMimeTypes.Contains(file.ContentType)
            || !HardCode.AllowedImagesExtensions.Contains(fileExtension)
        )
            return BadRequest(HardCode.GENERAL_BAD_FORMAT);

        // vérificcation volume
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(HardCode.TOO_BIG_FILE);

        try
        {
            var id = Guid.NewGuid();
            var fileName = $"pic_{id}{Path.GetExtension(file.FileName)}";
            var path = $"{mission.MinioFolderName}/{missionId}/pictures";

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
            Console.WriteLine($"Erreur upload image: {ex.Message}");
            return StatusCode(500, "Erreur lors de l'upload de l'image");
        }
    }

    /// <summary>
    ///     Upload un fichier/document pour une mission
    /// </summary>
    [HttpPost("{missionId:guid}/files")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileInfoResponse>> UploadFile(
        IFormFile file,
        Guid missionId,
        bool forceReplace = false
    )
    {
        // Vérification de la mission
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

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
            //var guid = Guid.NewGuid();
            //var time = DateTime.UtcNow.ToString("dd_M_y");
            //var fileName = $"doc_{time}_doc_{time}_{file.FileName}";
            var fileName = file.FileName;
            var path = $"{mission.MinioFolderName}/{missionId}/files";
            var fullPath = $"{path}/{fileName}";

            if (!forceReplace)
                if (!forceReplace)
                {
                    var fileExists = await minioService.DoesFileExistsAsync(fullPath);
                    if (fileExists)
                    {
                        return Conflict(HardCode.MINIO_FILE_ALREADY_EXISTS);
                    }
                }

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

    #endregion

    #region GET Mission Files & Pictures

    /// <summary>
    ///     Récupère tous les fichiers (documents) d'une mission
    /// </summary>
    [HttpGet("{missionId:guid}/files")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FileInfoResponse>>> GetMissionFiles(Guid missionId)
    {
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var files = await minioService.GetFilesWithMetadata(
            $"{mission.MinioFolderName}/{missionId}/files"
        );
        return Ok(files);
    }

    /// <summary>
    ///     Récupère toutes les photos/images d'une mission
    /// </summary>
    [HttpGet("{missionId:guid}/pictures")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FileInfoResponse>>> GetMissionPictures(Guid missionId)
    {
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var pictures = await minioService.GetFilesWithMetadata(
            $"{mission.MinioFolderName}/{missionId}/pictures"
        );
        return Ok(pictures);
    }

    #endregion

    #region DELETE Mission Files & Pictures

    /// <summary>
    ///     Supprime un fichier d'une mission
    /// </summary>
    [HttpDelete("{missionId:guid}/files/{fileName}")]
    public async Task<ActionResult> DeleteFile(Guid missionId, string fileName)
    {
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var files = await minioService.GetFilesWithMetadata(
            $"{mission.MinioFolderName}/{missionId}/files"
        );
        var file = files.FirstOrDefault(f => f.Name == fileName);
        if (file == null)
            return NotFound(HardCode.MINIO_FILE_NOT_FOUND);

        var fileUrl = $"{mission.MinioFolderName}/{missionId}/files/{fileName}";

        await minioService.RemoveFileAsync(fileUrl);
        return Ok();
    }

    /// <summary>
    ///     Supprime une photo d'une mission
    /// </summary>
    [HttpDelete("{missionId:guid}/pictures/{fileName}")]
    public async Task<ActionResult> DeletePicture(Guid missionId, string fileName)
    {
        var mission = await dbContext.Missions.FindAsync(missionId);
        if (mission == null)
            return NotFound(HardCode.MISSION_NOT_FOUND);

        var pictures = await minioService.GetFilesWithMetadata(
            $"{mission.MinioFolderName}/{missionId}/pictures"
        );
        var picture = pictures.FirstOrDefault(p => p.Name == fileName);
        if (picture == null)
            return NotFound(HardCode.MINIO_FILE_NOT_FOUND);

        var pictureUrl = $"{mission.MinioFolderName}/{missionId}/pictures/{fileName}";

        await minioService.RemoveFileAsync(pictureUrl);
        return Ok();
    }

    #endregion
}
