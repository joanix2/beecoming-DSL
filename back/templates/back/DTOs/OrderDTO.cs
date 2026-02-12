using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using opteeam_api.Models;

namespace opteeam_api.DTOs;

public class OrderInput
{
    public Guid? Id { get; set; }

    [Required] public required string Name { get; set; }

    public required string Comment { get; set; }

    [Required] public required Guid ClientId { get; set; }

    [Required] public required AddressInput Address { get; set; }

    [Required] public required Guid TypeId { get; set; }

    [Required] public required Guid StatusId { get; set; }

    public DateTimeOffset? ArchivedAt { get; set; }
}

public class OrderOutput
{
    public OrderOutput()
    {
    }

    [SetsRequiredMembers]
    public OrderOutput(Order order)
    {
        Id = order.Id;
        Name = order.Name;
        Comments = order.Comment;
        Client = new ClientOutput(order.Client);
        Address = new AddressOutput(order.Address);
        Type = new OrderTypeOutput(order.Type);
        Status = new OrderStatusOutput(order.Status);
        ArchivedAt = order.ArchivedAt;
        DisplayId = order.DisplayId;
        if (order.Missions is not null) MissionsInfos = order.Missions.Select(x => new MissionInfoOutput(x)).ToList();
    }

    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public string Comments { get; set; }
    public required ClientOutput Client { get; set; }
    public required AddressOutput Address { get; set; }
    public required OrderTypeOutput Type { get; set; }
    public required OrderStatusOutput Status { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public string DisplayId { get; set; }

    public List<MissionInfoOutput>? MissionsInfos { get; set; }
}

public class OrderAutoCompleteOutput
{
    /// <summary>
    ///     Constructeur de la classe
    /// </summary>
    /// <param name="order"></param>
    [SetsRequiredMembers]
    public OrderAutoCompleteOutput(Order order)
    {
        Id = order.Id;
        Name = order.Name;
    }

    public required Guid Id { get; set; }
    public required string Name { get; set; }
}

public class OrderListOutput
{
    public OrderListOutput()
    {
    }

    [SetsRequiredMembers]
    public OrderListOutput(Order order)
    {
        Id = order.Id;
        DisplayId = order.DisplayId;
        ClientName = order.Client.ContactName;
        Status = new OrderStatusOutput(order.Status);
        // Progression = nombre de missions terminées / nombre de missions total
        if (order.Missions.Count > 0)
        {
            var finishedStatusId = opteeam_api.Utils.MissionStatusIdEnum.MISSION_FINISHED_ID;
            int finishedCount = order.Missions.Count(m => m.StatusId.ToString() == finishedStatusId);
            Progression = $"{finishedCount}/{order.Missions.Count}";
        }
        else
        {
            Progression = "0/0";
        }
        PostalCode = order.Address.PostalCode;
        MissionIds = order.Missions.Select(m => m.Id.ToString()).ToList();
    }

    public required Guid Id { get; set; }
    public required string DisplayId { get; set; }
    public required string ClientName { get; set; }
    public required OrderStatusOutput Status { get; set; }
    public string? Progression { get; set; }
    public string? PostalCode { get; set; }
    public List<string> MissionIds { get; set; } = new List<string>();
}