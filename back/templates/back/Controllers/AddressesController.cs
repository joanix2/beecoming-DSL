using Microsoft.AspNetCore.Mvc;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Services;
using opteeam_api.Utils;

namespace opteeam_api.Controllers
{
    [Route("[controller]")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [ApiController]
    public class AddressesController : ControllerBase
    {
        private readonly AddressService addressService;

        public AddressesController(AddressService addressService)
        {
            this.addressService = addressService;
        }
        #region localiser l'adresse
        [HttpPost("localize-address")]
        public async Task<ActionResult<CoordinatesMinimal?>> LocalizeAddress(
            [FromBody] AddressInput input
        )
        {
            try
            {
                var coords = await addressService.GetCoordinatesAsync(input);
                return Ok(coords);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return BadRequest(HardCode.GENERAL_ERROR);
            }
        }
        #endregion
    }
}
