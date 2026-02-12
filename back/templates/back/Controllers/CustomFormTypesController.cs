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
[Authorize]
public class CustomFormTypesController(ApplicationDbContext dbContext) : ControllerBase
{
    // #region GET - DataGrid
    // /// <summary>
    // /// Récupérer la liste des types de formulaire
    // /// </summary>
    // [HttpGet]
    // public async Task<ActionResult<List<CustomFormTypeOutput>>> GetAllCustomFormTypes()
    // {
    //     var customFormTypes = await dbContext.CustomFormTypes.AsNoTracking().ToListAsync();
    //     return Ok(customFormTypes.Select(c => new CustomFormTypeOutput(c)).ToList());
    // }
    // #endregion

    // #region POST - Create custom form type
    // /// <summary>
    // /// Créer un nouveau type de formulaire
    // /// </summary>
    // [HttpPost]
    // public async Task<ActionResult<CustomFormTypeOutput>> CreateCustomFormType([FromBody] CustomFormTypeInput customFormTypeInput)
    // {
    //     var customFormType = new CustomFormType(customFormTypeInput);
    //     dbContext.CustomFormTypes.AddAsync(customFormType);
    //     await dbContext.SaveChangesAsync();
        
    //     return Ok(new CustomFormTypeOutput(customFormType));
    // }
    // #endregion

    // #region GET custom form type by id
    // /// <summary>
    // /// Récupérer un type de formulaire par son ID
    // /// </summary>
    // [HttpGet("{id:guid}")]
    // public async Task<ActionResult<CustomFormTypeOutput>> GetCustomFormTypeById(Guid id)
    // {
    //     var customFormType = await dbContext.CustomFormTypes
    //         .Include(c => c.CustomForm)
    //         .FirstOrDefaultAsync(c => c.Id == id);
            
    //     if (customFormType == null)
    //         return NotFound();
            
    //     return Ok(new CustomFormTypeOutput(customFormType));
    // }
    // #endregion
}