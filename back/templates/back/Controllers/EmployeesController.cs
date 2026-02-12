using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Utils;

namespace opteeam_api.Controllers;

[Route("[controller]")]
[ApiController]
[Produces("application/json")]
[Consumes("application/json")]
public class EmployeesController : ControllerBase
{
    private readonly ApplicationDbContext context;
    private readonly UserManager<ApplicationUser> userManager;

    public EmployeesController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager
    )
    {
        this.context = context;
        this.userManager = userManager;
    }

    /// <summary>
    /// trouver les opérateurs qui ne sont pas archivés
    /// </summary>
    [HttpGet("operators")]
    [Authorize(Roles = "supervisor")]
    public async Task<ActionResult<List<EmployeeOutput>>> GetOperatorsByTime(
        DateTimeOffset start,
        DateTimeOffset end
    )
    {
        List<ApplicationUser> employees = context
            .Users.Where(u => u.ArchivedAt == null)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == HardCode.OPERATOR_LABEL))
            .Include(u => u.UserAbsences)
            .ThenInclude(ua => ua.Type)
            .ToList();

        if (employees == null || !employees.Any())
        {
            return NotFound("Aucun opérateur trouvé");
        }
        return Ok(employees.Select(x => new EmployeeOutput(x)).ToList());
    }

    /// <summary>
    /// trouver les chefs d'équipe qui ne sont pas archivés ni abscents
    /// </summary>
    [HttpGet("teamleaders")]
    [Authorize(Roles = "supervisor")]
    public ActionResult<List<EmployeeOutput>> GetTeamLeadersByTime()
    {
        DateTimeOffset today = DateTimeOffset.UtcNow.Date.ToLocalTime();
        DateTimeOffset tomorrow = today.AddDays(1).ToLocalTime();

        var query = context
            .Users.Where(u => u.ArchivedAt == null)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == HardCode.TEAMLEADER_LABEL))
            .Include(u => u.UserAbsences.Where(a => a.StartDate >= today && a.EndDate <= tomorrow))
            .ThenInclude(ua => ua.Type)
            .Where(u => !u.UserAbsences.Any(a => a.StartDate >= today && a.EndDate <= tomorrow));

        var sql = query.ToQueryString();
        List<ApplicationUser> employees = query.ToList();

        if (employees == null || !employees.Any())
        {
            return NotFound("Aucun chef déquipe trouvé");
        }
        return Ok(employees.Select(x => new EmployeeOutput(x)).ToList());
    }

    [HttpGet("teamleaders-list")]
    [Authorize(Roles = "supervisor")]
    public ActionResult<List<EmployeeOutput>> GetTeamLeaders()
    {
        List<ApplicationUser> employees = context
            .Users.Where(u => u.ArchivedAt == null)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == HardCode.TEAMLEADER_LABEL))
            .Include(u => u.UserAbsences)
            .ThenInclude(ua => ua.Type)
            .ToList();

        if (employees == null || !employees.Any())
        {
            return NotFound("Aucun chef déquipe trouvé");
        }
        return Ok(employees.Select(x => new EmployeeOutput(x)).ToList());
    }

    [HttpGet("affect-operator")]
    [Authorize(Roles = "supervisor")]
    [AllowAnonymous]
    public async Task<ActionResult> AffectOperatorToTeamleader(
        [FromQuery] Guid teamleaderId,
        [FromQuery] Guid operatorId
    )
    {
        // Verify both users exist and have correct roles
        var teamleader = await context
            .Users.Where(u => u.Id == teamleaderId && u.ArchivedAt == null)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u =>
                u.UserRoles.Any(ur => ur.Role.Name == HardCode.TEAMLEADER_LABEL)
            );

        var operateur = await context
            .Users.Where(u => u.Id == operatorId && u.ArchivedAt == null)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u =>
                u.UserRoles.Any(ur => ur.Role.Name == HardCode.OPERATOR_LABEL)
            );

        if (teamleader is null || operateur is null)
        {
            return NotFound(HardCode.USER_NOT_FOUND);
        }

        // Check if teamleader already has active operator assignments
        //var hasActiveAssignments = await context.AffectationTeamleaderXOperators.AnyAsync(a =>
        //    a.TeamleaderId == teamleaderId && a.ArchivedAt == null && a.EndedAt == null
        //);

        //if (hasActiveAssignments)
        //{
        //    return BadRequest(HardCode.AFFECTATION_TEAMLEADER_ALREADY_AFFECTED);
        //}

        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // End any current active assignment for the operator and teamleader
            var latestAffectationOpe = await context
                .AffectationTeamleaderXOperators.Where(a =>
                    a.OperatorId == operatorId && a.ArchivedAt == null && a.EndedAt == null
                )
                .OrderBy(a => a.StartedAt)
                .LastOrDefaultAsync();

            var latestAffectationTL = await context
                .AffectationTeamleaderXOperators.Where(a =>
                    a.TeamleaderId == teamleaderId && a.ArchivedAt == null && a.EndedAt == null
                )
                .OrderBy(a => a.StartedAt)
                .LastOrDefaultAsync();

            if (latestAffectationOpe is not null)
            {
                latestAffectationOpe.EndedAt = DateTimeOffset.UtcNow;
            }

            if (latestAffectationTL is not null)
            {
                latestAffectationTL.EndedAt = DateTimeOffset.UtcNow;
            }

            // Create new assignment
            var newAffectation = new AffectationTeamleaderXOperator(teamleaderId, operatorId);
            context.AffectationTeamleaderXOperators.Add(newAffectation);

            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(HardCode.AFFECTATION_OPERATOR_TEAMLEADER_SUCCESS);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return BadRequest(HardCode.AFFECTATION_OPERATOR_TEAMLEADER_FAIL);
        }
    }
}
