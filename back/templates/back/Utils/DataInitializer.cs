using Microsoft.AspNetCore.Identity;
using opteeam_api;
using opteeam_api.Models;
using opteeam_api.Utils;

namespace data_lib.Utility;

public static class DataInitializer
{
    public static async Task SeedRoles(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        var rolesWithColors = new RoleEnum().GetRoleAndColor();

        foreach (var (Id, role, color) in rolesWithColors)
            if (!await roleManager.RoleExistsAsync(role).ConfigureAwait(false))
            {
                var applicationRole = new ApplicationRole
                {
                    Id = Guid.Parse(Id),
                    Name = role,
                    Color = color,
                    NormalizedName = role.ToUpper()
                };

                await roleManager.CreateAsync(applicationRole).ConfigureAwait(false);
            }
    }

    public static async Task SeedUsers(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in new RoleEnum().GetEnum())
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = role,
                Firstname = role,
                Lastname = "Opteeam",
                Email =
                    $"{role.ToLower()}.opteeam@bee-{EnvironmentVariables.ENVIRONMENT.ToLower()}.fr",
                EmailConfirmed = true
            };
            if (await userManager.FindByEmailAsync(user.Email) == null)
            {
                await userManager.CreateAsync(user, "Password123!");
                await userManager.AddToRoleAsync(user, role);
            }
        }
    }

    public static async Task SeedOrderStatuses(IServiceProvider serviceProvider)
    {
        var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var orderStatuses = dbContext.OrderStatuses.ToList();
        List<OrderStatus> newOrderStatuses = new();

        foreach (var orderStatus in new OrderStatusIdEnum().GetEnum())
        {
            if (orderStatuses.Select(o => o.Id).Contains(orderStatus.Id))
            {
                var existingOrderStatus = orderStatuses.FirstOrDefault(o => o.Id == orderStatus.Id);
                if (existingOrderStatus != null)
                {
                    existingOrderStatus.Name = orderStatus.Name;
                    existingOrderStatus.Color = orderStatus.Color;
                    existingOrderStatus.Position = orderStatus.Position;
                    continue;
                }
            }

            newOrderStatuses.Add(orderStatus);
        }

        dbContext.OrderStatuses.AddRange(newOrderStatuses);
        await dbContext.SaveChangesAsync();
    }

    public static async Task SeedMissionStatuses(IServiceProvider serviceProvider)
    {
        var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var missionStatuses = dbContext.MissionStatuses.ToList();
        List<MissionStatus> newMissionStatuses = new();

        foreach (var missionStatus in new MissionStatusIdEnum().GetEnum())
        {
            if (missionStatuses.Select(m => m.Id).Contains(missionStatus.Id))
            {
                var existingMissionStatus = missionStatuses.FirstOrDefault(m => m.Id == missionStatus.Id);
                if (existingMissionStatus != null)
                {
                    existingMissionStatus.Name = missionStatus.Name;
                    existingMissionStatus.Color = missionStatus.Color;
                    existingMissionStatus.Position = missionStatus.Position;
                    continue;
                }
            }

            newMissionStatuses.Add(missionStatus);
        }

        dbContext.MissionStatuses.AddRange(newMissionStatuses);
        await dbContext.SaveChangesAsync();
    }

    public static async Task SeedFakeData(IServiceProvider serviceProvider)
    {
        var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();
        if (!dbContext.OrderTypes.Any())
        {
            Console.WriteLine("🚀 Seeding CommandeTypes...");
            var orderTypes = new List<OrderType>
            {
                new()
                {
                    Name = "Achat de Matériel",
                    Color = "#C64A5E",
                    Icon = "add_shopping_cart"
                },
                new()
                {
                    Name = "Sous-traitance",
                    Color = "#80001a",
                    Icon = "build"
                },
                new()
                {
                    Name = "Transport",
                    Color = "#00366e",
                    Icon = "departure_board"
                }
            };
            dbContext.OrderTypes.AddRange(orderTypes);
        }

        if (!dbContext.AbsenceTypes.Any())
        {
            Console.WriteLine("🚀 Seeding AbsenceTypes...");
            var absenceTypes = new List<AbsenceType>
            {
                new()
                {
                    Id = Guid.Parse(HardCode.CONGES_ID),
                    Name = "Congé Payé",
                    Color = "Green",
                    Icon = "📅"
                },
                new()
                {
                    Id = Guid.Parse(HardCode.MALADIE_ID),
                    Name = "Maladie",
                    Color = "Red",
                    Icon = "🤒"
                },
                new()
                {
                    Id = Guid.Parse(HardCode.FORMATION_ID),
                    Name = "Formation",
                    Color = "Blue",
                    Icon = "📚"
                }
            };
            dbContext.AbsenceTypes.AddRange(absenceTypes);
        }

        if (!dbContext.UserDocumentTypes.Any())
        {
            Console.WriteLine("🚀 Seeding UserDocumentTypes...");
            var userDocumentTypes = new List<UserDocumentType>
            {
                new()
                {
                    Id = Guid.Parse(HardCode.CARTE_IDENTITE_ID),
                    Name = "Carte d'Identité",
                    Color = "#000000",
                    Icon = "badge"
                },
                new()
                {
                    Id = Guid.Parse(HardCode.PERMIS_CONDUIRE_ID),
                    Name = "Permis de Conduire",
                    Color = "#003a7a",
                    Icon = "car_tag"
                },
                new()
                {
                    Id = Guid.Parse(HardCode.CERTIFICAT_MEDICAL_ID),
                    Name = "Certificat Médical",
                    Color = "#80001a",
                    Icon = "medical_information"
                }
            };
            dbContext.UserDocumentTypes.AddRange(userDocumentTypes);
        }

        dbContext.SaveChanges();
    }


    public static async Task SeedInitialSettings(IServiceProvider serviceProvider)
    {
        var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();
        if (dbContext.Settings.Any()) return;

        var setting = new Setting
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
            OperatorStartAddress = new Address
            {
                Id = Guid.NewGuid(),
                Street = "123 Rue de départ des opérateurs",
                AdditionalInfo = "Random Adresse de base",
                PostalCode = "75000",
                City = "Paris",
                Country = "France",
                Latitude = 48.8566,
                Longitude = 2.3522
            },
            BillingAddress = new Address
            {
                Id = Guid.NewGuid(),
                Street = "123 Rue de facturation",
                AdditionalInfo = "Random Adresse facturation",
                PostalCode = "75000",
                City = "Paris",
                Country = "France",
                Latitude = 48.8566,
                Longitude = 2.3522
            },
            Phone = "0123456789",
            Fax = "0123456789",
            Url = "https://opteeam.com",
            Email = "contact@opteeam.com",
            CompanyName = "Opteeam",
            SirenNumber = "123456789",
            LegalForm = "SAS",
            ApeCode = "123456789"
        };
        await dbContext.Settings.AddAsync(setting);
        await dbContext.SaveChangesAsync();
    }
}