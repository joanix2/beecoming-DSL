using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using opteeam_api.DTOs;
using opteeam_api.Models;
using opteeam_api.Utils;
using System.Data.Common;
using Address = opteeam_api.Models.Address;

namespace opteeam_api.Services;

public class BogusService
{
    private readonly ApplicationDbContext context;
    private readonly UserManager<ApplicationUser> userManager;

    public BogusService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    public async Task GenerateFakeUsers(int userCount)
    {
        var roles = new[]
        {
            HardCode.SUPERVISOR_LABEL,
            HardCode.OPERATOR_LABEL,
            HardCode.TEAMLEADER_LABEL
        };
        //var users = FakeUserFactory.GenerateFakeUsers(userCount);
        var fakeUsers = FakeUserFactory.GenerateFakeUsers(userCount);

        var password = "Password123!";

        var userApp = new ApplicationUser(fakeUsers.First());
        userApp.EmailConfirmed = true;

        // role enum instance
        var roleEnum = new RoleEnum();
        // 1 superviseur
        var result = await userManager.CreateAsync(userApp, password);
        if (!result.Succeeded)
            Console.WriteLine(string.Join(", ", result.Errors.Select(e => e.Description)));
        else
        {
            userApp.Color = roleEnum.SUPERVISOR.Color;
            await userManager.AddToRoleAsync(userApp, roles[0]);
            await context.SaveChangesAsync();

        }

        // 6 chef d'équipe
        foreach (var user in fakeUsers.Skip(1).Take(6))
        {
            userApp = new ApplicationUser(user);
            userApp.Color = roleEnum.TEAMLEADER.Color;
            result = await userManager.CreateAsync(userApp, password);
            if (!result.Succeeded)
            {
                Console.WriteLine(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            else
            {
                // Assigner un rôle aléatoire à l'utilisateur
                var randomRole = roles[new Random().Next(roles.Length)];
                await userManager.AddToRoleAsync(userApp, roles[2]);
            }
        }
        await context.SaveChangesAsync();

        foreach (var user in fakeUsers.Skip(6))
        {
            userApp = new ApplicationUser(user);
            userApp.Color = roleEnum.OPERATOR.Color;

            result = await userManager.CreateAsync(userApp, password);
            if (!result.Succeeded)
            {
                Console.WriteLine(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            else
            {
                // Assigner un rôle aléatoire à l'utilisateur
                var randomRole = roles[new Random().Next(roles.Length)];
                await userManager.AddToRoleAsync(userApp, roles[1]);
            }
        }

        await context.SaveChangesAsync();
    }

    public async Task<List<Address>> GenerateFakeAddresses(int addressesCount)
    {
        if (addressesCount <= 0) return new List<Address>();
        var addressesDTO = FakeAddressFactory.GenerateAddresses(addressesCount);
        var addresses = addressesDTO.Select(x => new Address(x));
        context.Addresses.AddRange(addresses);
        await context.SaveChangesAsync();
        return addresses.ToList();
    }

    // generate fake Client
    public async Task GenerateFakeClient(int count)
    {
        var clientsDTO = FakeClientFactory.GenerateClients(count);
        //var clients = clientsDTO.Select(x => new Client(x)).ToList();

        List<ClientInput> clients = new();
        foreach (var clientDTO in clientsDTO)
        {
            var addressesDTO = FakeAddressFactory.GenerateAddresses(1).First();
            clientDTO.Address = addressesDTO;
            var client = new Client(clientDTO);
            context.Clients.Add(client);
        }

        context.SaveChanges();
    }

    // generer des commandes
    public async Task GenerateFakeOrder(int count)
    {
        var clientsIds = context.Clients.Select(x => x.Id).ToList();
        var typeIds = context.OrderTypes.Select(x => x.Id).ToList();
        var statusIds = context.OrderStatuses.Select(x => x.Id).ToList();
        var addresses = context.Addresses.Take(100).ToList();

        var ordersDTO = FakeOrderFactory.GenerateOrders(clientsIds, statusIds, typeIds, count);
        List<Order> orders = new();

        var random = new Random();
        foreach (var orderDTO in ordersDTO)
        {
            var client = context.Clients.First(c => c.Id == orderDTO.ClientId);
            var orderType = context.OrderTypes.FirstOrDefault(ct => ct.Id == orderDTO.TypeId);

            var index = random.Next(addresses.Count);
            var addresse = addresses[index];

            index = random.Next(statusIds.Count);
            var statusId = statusIds[index];
            var Id = Guid.NewGuid();
            var order = new Order
            {
                Id = Id,
                Name = orderDTO.Name,
                //Client = client,
                ClientId = client.Id,
                Address = addresse,
                //Type = orderType,
                TypeId = orderType.Id,
                Comment = orderDTO.Comment,
                StatusId = statusId,
                DisplayId = StructureIdGenerator.GenerateDisplayId(Id, "CMD")
            };

            orders.Add(order);
        }

        context.Orders.AddRange(orders);
        context.SaveChanges();
    }

    public async Task GenerateFakeMissions(int count)
    {
        var addresses = context.Addresses.ToList();
        var orderIds = context.Orders.Select(x => x.Id).ToList();
        var typeIds = context.MissionTypes.Select(x => x.Id).ToList();
        var statusIds = context.MissionStatuses.Select(x => x.Id).ToList();
        var teamleaderIds = (await userManager.GetUsersInRoleAsync(HardCode.TEAMLEADER_LABEL))
            .Select(x => x.Id)
            .ToList();

        if (typeIds.Count == 0 || orderIds.Count == 0 || statusIds.Count == 0 || teamleaderIds.Count == 0)
            throw new Exception("Erreur type/status ou commande  sont vides");

        var faker = new Faker();

        for (var i = 0; i < count; i++)
        {
            var Id = Guid.NewGuid();
            var mission = new Mission
            {
                Id = Id,
                Name = faker.Company.CompanyName(),
                TypeId = faker.PickRandom(typeIds),
                StatusId = faker.PickRandom(statusIds),
                //TeamLeaderId = faker.PickRandom(teamleaderIds),
                DateTo = faker.Date.PastOffset().UtcDateTime,
                DateFrom = faker.Date.PastOffset().UtcDateTime,
                Comments = faker.Lorem.Sentence(),
                OrderId = faker.PickRandom(orderIds),
                InternalComments = faker.Lorem.Word(),
                Address = faker.PickRandom(addresses),
                DisplayId = StructureIdGenerator.GenerateDisplayId(Id, "MSN")
            };

            context.Missions.Add(mission);
        }

        context.SaveChanges();
    }

    public async Task GenerateFakeAbsenceUser(int count)
    {
        //var teamleaders = await userManager.GetUsersInRoleAsync("Chef d'équipe");
        var users = await context.Users.ToListAsync();
        var absenceTypesIds = context.AbsenceTypes.Select(x => x.Id).ToList();
        var random = new Random();
        var faker = new Faker();

        foreach (var leader in users)
        {
            var start = faker.Date.PastOffset().UtcDateTime;
            var userAbsence = new UserAbsence
            {
                Id = Guid.NewGuid(),
                StartDate = start,
                EndDate = start.AddDays(1),
                Comments = faker.Lorem.Sentence(),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                TypeId = faker.PickRandom(absenceTypesIds),
                UserId = leader.Id,
                FileName = faker.Lorem.Word() + "." + faker.Lorem.Sentence()[..2],
                Url = faker.Internet.Url()
            };
            context.UserAbsences.Add(userAbsence);
        }

        await context.SaveChangesAsync();
    }
}

public static class FakeUserFactory
{
    public static List<UserInput> GenerateFakeUsers(int count)
    {
        var userFaker = new Faker<UserInput>("fr")
            .StrictMode(true)
            .RuleFor(u => u.Firstname, f => f.Name.FirstName())
            .RuleFor(u => u.Lastname, f => f.Name.LastName())
            .RuleFor(u => u.Email, (f, u) => f.Internet.Email(u.Firstname, u.Lastname))
            .RuleFor(u => u.RoleIds, f => new List<Guid>())
            .RuleFor(u => u.AffectedToTeamleaderId, f => null)
            .RuleFor(u => u.Color, f => "red")
            .RuleFor(u => u.ArchivedAt, f => null);

        return userFaker.Generate(count);
    }
}

public static class FakeAddressFactory
{
    public static Faker<AddressInput> GetFaker()
    {
        return new Faker<AddressInput>("fr")
            .StrictMode(true)
            .RuleFor(a => a.Id, f => f.Random.Bool(0.8f) ? f.Random.Guid() : null) // 80% chance to have Id
            .RuleFor(a => a.Street, f => f.Address.StreetAddress())
            .RuleFor(a => a.AdditionalInfo, f => "Random Adresse")
            .RuleFor(a => a.PostalCode, f => f.Address.ZipCode())
            .RuleFor(a => a.City, f => f.Address.City())
            .RuleFor(a => a.Country, f => f.Address.Country())
            .RuleFor(a => a.Latitude, f => f.Random.Bool(0.7f) ? f.Address.Latitude() : null)
            .RuleFor(a => a.Longitude, f => f.Random.Bool(0.7f) ? f.Address.Longitude() : null);
    }

    public static List<AddressInput> GenerateAddresses(int count)
    {
        return GetFaker().Generate(count);
    }
}

public static class FakeClientFactory
{
    public static Faker<ClientInput> GetFaker()
    {
        return new Faker<ClientInput>("fr")
            .StrictMode(true)
            .RuleFor(c => c.Id, f => Guid.NewGuid())
            .RuleFor(c => c.ContactName, f => f.Name.FirstName())
            .RuleFor(c => c.Email, (f, c) => f.Internet.Email(c.ContactName))
            .RuleFor(c => c.PhoneNumber, f => f.Phone.PhoneNumber("06 ## ## ## ##"))
            .RuleFor(c => c.Company, f => f.Company.CompanyName())
            .RuleFor(c => c.Address, f => null)
            .RuleFor(c => c.ArchivedAt, f => f.Random.Bool(0.15f) ? f.Date.PastOffset() : null); // 15% d'archivés
    }

    public static List<ClientInput> GenerateClients(int count)
    {
        return GetFaker().Generate(count);
    }
}

public static class FakeOrderFactory
{
    public static Faker<OrderInput> GetOrderFaker(
        List<Guid> clientIds,
        List<Guid> statusIds,
        List<Guid> typeIds
    )
    {
        return new Faker<OrderInput>("fr")
            .StrictMode(true)
            .RuleFor(c => c.ClientId, f => f.PickRandom(clientIds))
            .RuleFor(c => c.TypeId, f => f.PickRandom(typeIds))
            .RuleFor(c => c.Name, f => f.Commerce.ProductName()) // ou f.Name.JobTitle()
            .RuleFor(c => c.Comment, f => f.Lorem.Sentence())
            .RuleFor(c => c.Address, f => FakeAddressFactory.GenerateAddresses(1).First())
            .RuleFor(c => c.Id, f => Guid.NewGuid())
            .RuleFor(c => c.StatusId, f => f.PickRandom(statusIds))
            .RuleFor(c => c.ArchivedAt, f => f.Random.Bool(0.1f) ? f.Date.PastOffset() : null);
    }

    public static List<OrderInput> GenerateOrders(
        List<Guid> clientIds,
        List<Guid> statusIds,
        List<Guid> typeIds,
        int count
    )
    {
        try
        {
            return GetOrderFaker(clientIds, statusIds, typeIds).Generate(count);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            throw;
        }
    }
}