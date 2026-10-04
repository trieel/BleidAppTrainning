using Microsoft.AspNetCore.Mvc;
using BleidAppTraining.Application.Common;

namespace BleidAppTraining.API.Middleware;

public sealed class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger,
    IWebHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception while processing {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            var (status, title, detail) = exception switch
            {
                ServiceValidationException validation => (
                    StatusCodes.Status400BadRequest,
                    "The request is invalid.",
                    string.Join(" ", validation.Errors)),
                KeyNotFoundException => (
                    StatusCodes.Status404NotFound,
                    "The requested resource was not found.",
                    null),
                UnauthorizedAccessException => (
                    StatusCodes.Status401Unauthorized,
                    "Authentication is required.",
                    null),
                _ => (
                    StatusCodes.Status500InternalServerError,
                    "An unexpected error occurred.",
                    environment.IsDevelopment() ? exception.Message : null)
            };

            var problem = new ProblemDetails
            {
                Type = "https://datatracker.ietf.org/doc/html/rfc9457",
                Title = title,
                Status = status,
                Detail = detail,
                Instance = context.Request.Path
            };

            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
