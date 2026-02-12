using Microsoft.AspNetCore.Identity;

namespace opteeam_api.Models
{
    public class ApplicationRole : IdentityRole<Guid>
    {
        public ICollection<ApplicationUserRole> UserRoles { get; set; }
        public string? Color { get; internal set; }
    }
}
