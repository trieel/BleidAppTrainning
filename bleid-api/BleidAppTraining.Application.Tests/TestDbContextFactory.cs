using BleidAppTraining.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Application.Tests;

public static class TestDbContextFactory
{
    public static BleidDbContext Create(string dbName)
    {
        var options = new DbContextOptionsBuilder<BleidDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new BleidDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
