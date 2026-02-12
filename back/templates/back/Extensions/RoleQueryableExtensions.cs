using System.Linq;
using Microsoft.EntityFrameworkCore;
using opteeam_api.Models;
using opteeam_api.DTOs;

namespace opteeam_api.Extensions
{
    public static class RoleQueryableExtensions
    {
        /// <summary>
        /// Filtre les rôles en fonction de la liste cible et les transforme en DTO.
        /// </summary>
        public static IQueryable<ApplicationRole> FilterRoles(this IQueryable<ApplicationRole> roles,
            string[]? targetRoles = null)
        {
            return roles
                .AsNoTracking()
                .Where(r => targetRoles != null ? targetRoles.Contains(r.Name.ToLower()) : true);
        }
    }
}