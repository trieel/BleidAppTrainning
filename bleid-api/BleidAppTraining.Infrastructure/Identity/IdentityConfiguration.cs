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
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

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

    public static async Task InitializeDatabaseAsync(this IApplicationBuilder application)
    {
        using var scope = application.ApplicationServices.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BleidDbContext>();
        await dbContext.Database.MigrateAsync();

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
    }
}
