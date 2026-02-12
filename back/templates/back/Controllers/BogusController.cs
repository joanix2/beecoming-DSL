using Microsoft.AspNetCore.Mvc;
using opteeam_api.Services;

namespace opteeam_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BogusController : ControllerBase
    {
        private readonly BogusService bogusService;
        private readonly ApplicationDbContext dbContext;

        public BogusController(BogusService bogusService, ApplicationDbContext dbContext)
        {
            this.bogusService = bogusService;
            this.dbContext = dbContext;
        }

        [HttpGet("generateUsers")]
        public async Task<IActionResult> GenerateFakeUsers(int userCount)
        {
            if (userCount < 10 || userCount > 1000 )
            {
                userCount = 10;
            }
            await bogusService.GenerateFakeUsers(userCount);
            return Ok($"Génération de {userCount} utilisateurs factices réussie.");
        }
        [HttpGet("generateAddresses")]
        public async Task<IActionResult> GenerateFakeAddresses(int count)
        {
            if(count <= 0)
            {
                count = 1;
            }
            await bogusService.GenerateFakeAddresses(count);
            return Ok($"Génération de {count} adresses factices réussie.");
        }

        [HttpGet("generateClients")]
        public async Task<IActionResult> GenerateFakeClients(int count)
        {
            if (count <= 0)
            {
                count = 1;
            }
            await bogusService.GenerateFakeClient(count);
            return Ok($"Génération de {count} clients factices réussie.");
        }

        [HttpGet("generateOrders")]
        public async Task<IActionResult> GenerateFakeOrders(int count)
        {
            if (count <= 0)
            {
                count = 1;
            }
            await bogusService.GenerateFakeOrder(count);
            return Ok($"Génération de {count} commandes factices réussie.");
        }

        [HttpGet("generateMissions")]
        public async Task<IActionResult> GenerateFakeMissions(int count)
        {
            if (count <= 0)
            {
                count = 1;
            }
            await bogusService.GenerateFakeMissions(count);
            return Ok($"Génération de {count} missions factices réussie.");
        }

        [HttpGet("generate-user-absence")]
        public async Task<IActionResult> GenerateFakeUserAbsence([FromQuery] int count)
        {
            await bogusService.GenerateFakeAbsenceUser(count);
            return Ok($"Génération de {count} absences");
        }

        [HttpGet("generate-default-setting")]
        public async Task<IActionResult> GenerateDefaultSetting()
        {
            var setting = new Models.Setting
            {
                Id = Guid.NewGuid(),
                ApplicationName = "Opteeam",
                ApplicationLogo = "https://opteeam.com/logo.png",
                DefaultPlanningMode = "daily",
                ShowWeekendsInPlanning = true,
                MissionAsAppointment = true,
                GrayOutFinishedMissions = true,
                PrimaryColor = "#000000",
                SecondaryColor = "#000000",
                TertiaryColor = "#000000",
                OperatorStartAddress = new Models.Address
                {
                    Id = Guid.NewGuid(),
                    Street = "123 Rue de départ des opérateurs",
                    AdditionalInfo = "Random Adresse",
                    PostalCode = "75000",
                    City = "Paris",
                    Country = "France",
                    Latitude = 48.8566,
                    Longitude = 2.3522
                },
                BillingAddress = new Models.Address
                {
                    Id = Guid.NewGuid(),
                    Street = "123 Rue de facturation",
                    AdditionalInfo = "Random Adresse",
                    PostalCode = "75000",
                    City = "Paris",
                    Country = "France",
                    Latitude = 48.8566,
                    Longitude = 2.3522
                },
                Phone = "01 23 45 67 89",
                Fax = "01 23 45 67 89",
                Url = "https://opteeam.com",
                Email = "contact@opteeam.com",
                CompanyName = "Opteeam",
                SirenNumber = "123456789",
                LegalForm = "SAS",
                ApeCode = "123456789",
            };
            await dbContext.Settings.AddAsync(setting);
            await dbContext.SaveChangesAsync();
            return Ok(setting); 
        }
    }
}
