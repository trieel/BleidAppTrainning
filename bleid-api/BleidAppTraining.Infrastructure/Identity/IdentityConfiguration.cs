using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BleidAppTraining.Infrastructure.Identity;

public static class IdentityConfiguration
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var rawConnectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

        var connectionString = NormalizeConnectionString(rawConnectionString);

        services.AddDbContext<BleidDbContext>(options => options
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(BleidDbContext).Assembly.FullName))
            .UseSnakeCaseNamingConvention());

        services.AddIdentityCore<User>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.SignIn.RequireConfirmedEmail = false;

                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddSignInManager()
            .AddEntityFrameworkStores<BleidDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }

    public static string NormalizeConnectionString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return connectionString;

        connectionString = connectionString.Trim();
        if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            var match = System.Text.RegularExpressions.Regex.Match(connectionString, @"^postgres(?:ql)?://([^:]+):(.+)@([^:/]+)(?::(\d+))?/(.+)$");
            if (match.Success)
            {
                var username = match.Groups[1].Value;
                var password = match.Groups[2].Value;
                var host = match.Groups[3].Value;
                var port = match.Groups[4].Success ? match.Groups[4].Value : "5432";
                var database = match.Groups[5].Value.Split('?')[0];
                connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
            }
        }

        if (!connectionString.Contains("SSL Mode", StringComparison.OrdinalIgnoreCase) &&
            !connectionString.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ";SSL Mode=Require;Trust Server Certificate=true";
        }

        if (!connectionString.Contains("GSS Enc Mode", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ";GSS Enc Mode=Disable";
        }

        return connectionString;
    }

    public static async Task InitializeDatabaseAsync(this IApplicationBuilder application)
    {
        Console.WriteLine(">>> [BleidApp] (1/4) Creating ServiceScope...");
        using var scope = application.ApplicationServices.CreateScope();

        Console.WriteLine(">>> [BleidApp] (2/4) Resolving BleidDbContext...");
        var dbContext = scope.ServiceProvider.GetRequiredService<BleidDbContext>();

        Console.WriteLine(">>> [BleidApp] (3/4) Applying EF Core database migrations...");
        await dbContext.Database.MigrateAsync();

        Console.WriteLine(">>> [BleidApp] (4/4) Seeding default roles and exercises...");
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var roleName in new[] { RoleNames.User, RoleNames.Admin })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(error => error.Description));
                    throw new InvalidOperationException($"Could not seed role '{roleName}': {errors}");
                }
            }
        }

        await SeedData.SeedAsync(dbContext);
        Console.WriteLine(">>> [BleidApp] InitializeDatabaseAsync completed successfully.");
    }
}
