using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using opteeam_api.Extensions;
using opteeam_api.Models;
using opteeam_api.Utilities;
using opteeam_api.Utils;

namespace opteeam_api
{
    public class ApplicationDbContext
        : IdentityDbContext<
            ApplicationUser,
            ApplicationRole,
            Guid,
            IdentityUserClaim<Guid>,
            ApplicationUserRole,
            IdentityUserLogin<Guid>,
            IdentityRoleClaim<Guid>,
            IdentityUserToken<Guid>
        >
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<CustomForm> CustomForm { get; set; }
        public DbSet<CustomFormResponse> CustomFormResponses { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Mission> Missions { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<MissionPhoto> MissionPhotos { get; set; }
        public DbSet<MissionDocument> MissionDocuments { get; set; }
        public DbSet<UserAbsence> UserAbsences { get; set; }

        public DbSet<OrderType> OrderTypes { get; set; }
        public DbSet<OrderDocumentType> OrderDocumentTypes { get; set; }
        public DbSet<MissionType> MissionTypes { get; set; }
        public DbSet<MissionPhotoType> MissionPhotoTypes { get; set; }
        public DbSet<MissionDocumentType> MissionDocumentTypes { get; set; }
        public DbSet<AbsenceType> AbsenceTypes { get; set; }
        public DbSet<UserDocumentType> UserDocumentTypes { get; set; }

        public DbSet<OrderStatus> OrderStatuses { get; set; }
        public DbSet<MissionStatus> MissionStatuses { get; set; }
        public DbSet<AffectationTeamleaderXOperator> AffectationTeamleaderXOperators { get; set; }

        // assignation Mission X Teamleaders
        public DbSet<AffectationMissionXTeamLeader> AffectationMissionXTeamLeaders { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql(
                connectionString: EnvironmentVariables.CONNECTION_STRING,
                npgsqlOptionsAction: o =>
                    o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
            );
            optionsBuilder.EnableDetailedErrors();
            optionsBuilder.EnableSensitiveDataLogging();
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder
                .Properties<DateTimeOffset>()
                .HaveConversion<CustomDateTimeConversion>();
            base.ConfigureConventions(configurationBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //modelBuilder.Entity<Mission>()
            //    .HasOne(m => m.TeamLeader)
            //    .WithMany(u => u.Missions)
            //    .HasForeignKey(m => m.TeamLeaderId)
            //    .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<MissionPhoto>().ToTable("MissionPhotos");
            modelBuilder.Entity<MissionDocument>().ToTable("MissionDocuments");
            modelBuilder.Entity<OrderDocument>().ToTable("OrderDocuments");
            modelBuilder.Entity<UserDocument>().ToTable("UserDocuments");
            modelBuilder.Entity<UserAbsence>().ToTable("UserAbsences");

            modelBuilder.Entity<ApplicationUserRole>(userRole =>
            {
                userRole.HasKey(ur => new { ur.UserId, ur.RoleId });

                userRole
                    .HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId);

                userRole
                    .HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId);
            });

            modelBuilder
                .Entity<CustomForm>()
                .HasMany(cf => cf.CustomFormResponses)
                .WithOne(s => s.CustomForm)
                .HasForeignKey(s => s.CustomFormId);

            modelBuilder.Entity<CustomForm>(entity =>
            {
                entity.Property(e => e.Structure).HasColumnType("jsonb");
            });

            modelBuilder
                .Entity<Client>()
                .HasMany(c => c.Orders)
                .WithOne(o => o.Client)
                .HasForeignKey(o => o.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .HasDbFunction(() => NpgsqlExtensions.Levenshtein(default!, default!))
                .HasName("levenshtein");

            modelBuilder
                .HasDbFunction(() => NpgsqlExtensions.Similarity(default!, default!))
                .HasName("similarity");

            modelBuilder
                .Entity<Address>()
                .HasIndex(a => new
                {
                    a.AdditionalInfo,
                    a.Street,
                    a.PostalCode,
                    a.City,
                    a.Country,
                })
                .IsUnique();

            modelBuilder.Entity<AffectationTeamleaderXOperator>().HasQueryFilter(x => x.ArchivedAt == null);
            modelBuilder.Entity<AffectationMissionXTeamLeader>().HasQueryFilter(x => x.ArchivedAt == null);
            modelBuilder.Entity<MissionType>().HasQueryFilter(x => x.ArchivedAt == null);
            modelBuilder.Entity<CustomForm>().HasQueryFilter(x => x.ArchivedAt == null);
            modelBuilder.Entity<OrderType>().HasQueryFilter(x => x.ArchivedAt == null);
            modelBuilder.Entity<Mission>().HasQueryFilter(x => x.ArchivedAt == null);
            modelBuilder.Entity<Order>().HasQueryFilter(x => x.ArchivedAt == null);
        }
    }
}
