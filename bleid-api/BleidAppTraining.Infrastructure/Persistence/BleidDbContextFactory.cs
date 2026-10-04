using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BleidAppTraining.Infrastructure.Persistence;

public class BleidDbContextFactory : IDesignTimeDbContextFactory<BleidDbContext>
{
    public BleidDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
            ?? "Host=localhost;Database=bleidapp;Username=dev;Password=dev";

        var optionsBuilder = new DbContextOptionsBuilder<BleidDbContext>();
        optionsBuilder
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention();

        return new BleidDbContext(optionsBuilder.Options);
    }
}
