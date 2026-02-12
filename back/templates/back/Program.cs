using System.Reflection;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using data_lib.Utility;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using opteeam_api;
using opteeam_api.Extensions;
using opteeam_api.Models;
using opteeam_api.Services;
using opteeam_api.Utils;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedUrls = new List<string>
        {
            EnvironmentVariables.FRONT_URL
        };
        if (EnvironmentVariables.ENVIRONMENT != "prod")
        {
            var localNetworkIps = Enumerable.Range(100, 200).ToArray();
            var localNetworkIpsString = localNetworkIps.Select(ip => $"http://10.0.0.{ip}:4200").ToList();
            var localNetworkIpsStringCapacitor = localNetworkIps.Select(ip => $"http://10.0.0.{ip}:8100").ToList();
            allowedUrls.AddRange(localNetworkIpsString);
            allowedUrls.AddRange(localNetworkIpsStringCapacitor);
            allowedUrls.Add("http://localhost:4200");
            allowedUrls.Add("http://localhost:8100");
            allowedUrls.Add("https://opteeam.bee-dev.fr");
        }
        policy
            .WithOrigins(allowedUrls.ToArray())
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddResponseCompressionSetup();
builder.Services.AddLocalizationSetup();
builder.Services.AddSwaggerWithJwt();
builder.Services.AddDbContext<ApplicationDbContext>();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<ODataSwaggerDecoratorOptions>();
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
    {
        options.Password.RequiredLength = 8; // Longueur minimale
        options.Password.RequireDigit = true; // Au moins un chiffre
        options.Password.RequireNonAlphanumeric = true; // Au moins un caractère spécial
        options.Password.RequireUppercase = false; // Facultatif : pas besoin de majuscules
        options.Password.RequireLowercase = true; // Au moins une lettre minuscule
        options.SignIn.RequireConfirmedEmail = true;
        options.User.RequireUniqueEmail = true;
        options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
        options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultProvider;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders()
    .AddErrorDescriber<FrenchIdentityErrorDescriber>();

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<BogusService>();

builder.Services.AddHttpClient();

builder.Services.AddSingleton<MinioService>(sp =>
{
    var minioUrl = Environment.GetEnvironmentVariable("MINIO_URL");
    var minioAccessKey = Environment.GetEnvironmentVariable("MINIO_ACCESSKEY");
    var minioSecretKey = Environment.GetEnvironmentVariable("MINIO_SECRETKEY");

    return new MinioService(minioUrl, minioAccessKey, minioSecretKey);
});

builder.Services
    .AddControllers(options =>
    {
        options.Conventions.Add(new RouteTokenTransformerConvention(new SlugifyParameterTransformer()));
    }).AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); /* show enum value in swagger. */
    }).AddOData(options => { options.Filter().Count().OrderBy().SetMaxTop(1000); });

builder.Services.AddScoped<AddressService>();


//bool isDesignTime = AppDomain.CurrentDomain.GetAssemblies()
//    .Any(a => a.FullName != null && a.FullName.StartsWith("Microsoft.EntityFrameworkCore.Design"));

//if (!isDesignTime)
//{
//    builder.Services.AddHostedService<ImportDataJob>();
//}


var app = builder.Build();

app.UseStaticFiles();

using (var scope = app.Services.CreateScope())
{
    var setConnectionString = EnvironmentVariables.CONNECTION_STRING;
    NpgsqlConnection.GlobalTypeMapper.EnableDynamicJson();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
    await DataInitializer.SeedRoles(scope.ServiceProvider);
    await DataInitializer.SeedUsers(scope.ServiceProvider);
    await DataInitializer.SeedOrderStatuses(scope.ServiceProvider);
    await DataInitializer.SeedMissionStatuses(scope.ServiceProvider);
    await DataInitializer.SeedInitialSettings(scope.ServiceProvider);
}

//app.UseHttpsRedirection();
//app.UseHsts();

if (EnvironmentVariables.ENVIRONMENT != "prod")
{
    Console.WriteLine($"Environment: {EnvironmentVariables.ENVIRONMENT}");
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseRequestLocalization();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();