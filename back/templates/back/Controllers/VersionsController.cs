using Microsoft.AspNetCore.Mvc;

namespace opteeam_api.Controllers
{
    /// <summary>
    /// Controller to get the version of the API
    /// </summary>
    [ApiController]
    [Route("")]
    [Produces("application/json")]
    [Consumes("application/json")]
    public class VersionsController : ControllerBase
    {
        /// <summary>
        /// Get the version of the API
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Produces("text/plain")]
        public String GetVersion()
        {
            try
            {
                return System.IO.File.ReadAllText("version.json");
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return "No version found";
            }
        }
    }
}
