using BleidAppTraining.Application.Interfaces;
using BleidAppTraining.Application.Services;
using BleidAppTraining.Infrastructure.Identity;
using BleidAppTraining.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BleidAppTraining.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddIdentityInfrastructure(configuration);
        services.AddScoped<IApplicationDbContext>(serviceProvider =>
            serviceProvider.GetRequiredService<BleidDbContext>());
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOnboardingService, OnboardingService>();
        services.AddScoped<IExerciseService, ExerciseService>();
        services.AddScoped<IRoutineService, RoutineService>();
        services.AddScoped<IWorkoutService, WorkoutService>();
        services.AddScoped<IProgressService, ProgressService>();
        services.AddScoped<IBodyWeightService, BodyWeightService>();

        return services;
    }
}
