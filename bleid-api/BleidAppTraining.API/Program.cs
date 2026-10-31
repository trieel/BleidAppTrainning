using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BleidAppTraining.API.Filters;
using BleidAppTraining.API.Middleware;
using BleidAppTraining.Application.Validators;
using BleidAppTraining.Infrastructure;
using BleidAppTraining.Infrastructure.Identity;
using BleidAppTraining.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

Console.WriteLine(">>> [BleidApp] Starting Web API host initialization...");

var builder = WebApplication.CreateBuilder(args);

var customPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(customPort))
{
    Console.WriteLine($">>> [BleidApp] Binding Kestrel to PORT={customPort}");
    builder.WebHost.UseUrls($"http://*:{customPort}");
}

const string FrontendCorsPolicy = "Frontend";
const string AuthRateLimitPolicy = "AuthPolicy";

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddControllers(options =>
    {
        options.Filters.Add<RequestValidationFilter>();
    })
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddValidatorsFromAssemblyContaining<RegisterCommandValidator>();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthRateLimitPolicy, context =>
    {
        var remoteIp = context.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrEmpty(remoteIp) && context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
        {
            remoteIp = forwarded.ToString().Split(',')[0].Trim();
        }
        var partitionKey = !string.IsNullOrEmpty(remoteIp) ? remoteIp : context.TraceIdentifier;

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<BleidDbContext>("database");

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}
builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

if (!builder.Environment.IsDevelopment() && Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException("Jwt:Secret must be at least 256 bits (32 bytes) in non-development environments.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "BleidAppTraining",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "BleidAppTraining",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "userId",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(RoleNames.Admin));
    options.AddPolicy("UserOnly", policy => policy.RequireRole(RoleNames.User));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        var frontendUrl = builder.Configuration["Frontend:Url"] ?? "http://localhost:3000";

        if (frontendUrl.Trim() == "*")
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            var origins = frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

try
{
    Console.WriteLine(">>> [BleidApp] Initializing database and applying migrations...");
    await app.InitializeDatabaseAsync();
    Console.WriteLine(">>> [BleidApp] Database migrations and seeds completed successfully.");
}
catch (Exception ex)
{
    Console.WriteLine($">>> [BleidApp] CRITICAL DATABASE INITIALIZATION ERROR: {ex.Message}");
    Console.WriteLine($">>> [BleidApp] Details: {ex}");
    throw;
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
    app.UseHsts();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapSwagger().AllowAnonymous();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors(FrontendCorsPolicy);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString().ToLowerInvariant(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString().ToLowerInvariant(),
                description = e.Value.Description,
                durationMs = Math.Round(e.Value.Duration.TotalMilliseconds, 2)
            }),
            totalDurationMs = Math.Round(report.TotalDuration.TotalMilliseconds, 2)
        };
        await context.Response.WriteAsJsonAsync(response);
    }
}).AllowAnonymous();

Console.WriteLine(">>> [BleidApp] Web API is starting up and listening for incoming requests...");
app.Run();
