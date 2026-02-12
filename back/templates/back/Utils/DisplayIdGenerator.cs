using Microsoft.EntityFrameworkCore;
using opteeam_api.Models;
using System.Reflection;

namespace opteeam_api.Utils
{
    public class DisplayIdGenerator
    {
        public static string GenerateDisplayId<T>(ApplicationDbContext dbContext, string? customPrefix = null, int? year = null) where T : BaseModel
        {
            var entityType = typeof(T);

            // Déterminer le préfixe
            var prefixProperty = entityType.GetProperty("DisplayIdPrefix", BindingFlags.Public | BindingFlags.Static);
            string prefix = customPrefix
                            ?? prefixProperty?.GetValue(null) as string
                            ?? entityType.Name[..Math.Min(3, entityType.Name.Length)].ToUpper();

            // Récupérer l'année actuelle
            var yearToUse = (year ?? DateTime.UtcNow.Year) % 100;

            // Construire le préfixe de recherche
            var displayIdStart = $"{prefix}-{yearToUse:D2}-";

            // Compter les entités déjà présentes en base
            var dbCount = dbContext.Set<T>()
                .IgnoreQueryFilters()
                .Count(e => EF.Property<string>(e, "DisplayId").StartsWith(displayIdStart));

            // Compter aussi les entités suivies par le ChangeTracker (non encore sauvegardées)
            var localCount = dbContext.ChangeTracker.Entries<T>()
                .Where(e => e.State != EntityState.Detached && e.State != EntityState.Unchanged)
                .Select(e => e.Property("DisplayId").CurrentValue as string)
                .Count(id => id != null && id.StartsWith(displayIdStart));

            // Générer le suffixe incrémental (base + mémoire)
            var suffix = (dbCount + localCount + 1).ToString("D4");

            // Construire l'identifiant final
            return $"{prefix}-{yearToUse:D2}-{suffix}";
        }
    }
}
