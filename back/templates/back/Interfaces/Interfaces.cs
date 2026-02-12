

namespace opteeam_api.Models;

/// <summary>  
/// Interface repr�sentant un objet pouvant �tre archiv�.  
/// </summary>  
public interface IArchivable
{
    /// <summary>  
    /// Obtient ou d�finit la date et l'heure d'archivage de l'objet.  
    /// </summary>  
    public DateTimeOffset? ArchivedAt { get; set; }
}

public interface IHasUser
{
    Guid UserId { get; set; }
    ApplicationUser User { get; set; }
}
public interface IHasAddress
{
    Guid AddressId { get; set; }
    Address Address { get; set; }
}
public interface IHasStatus<T> where T : BaseStatus
{
   Guid StatusId { get; set; }
   T Status { get; set; }
}

public interface IHasType<T> where T : BaseTypeStatus
{
    Guid TypeId { get; set; }
    T Type { get; set; }
}

public interface IHasFile
{
    public string FileName { get; set; }
    public string Url { get; set; }
}

public interface IHasDisplayFields
{
    public string Name { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
}
