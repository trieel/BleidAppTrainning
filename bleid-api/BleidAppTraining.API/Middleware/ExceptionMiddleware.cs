using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using BleidAppTraining.Application.Common;

namespace BleidAppTraining.API.Middleware;

public sealed class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
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
                ArgumentException argEx => (
                    StatusCodes.Status400BadRequest,
                    "The request is invalid.",
                    argEx.Message),
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
                    null)
            };

            Log(context, exception, status);

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

    private void Log(HttpContext context, Exception exception, int status)
    {
        var state = new Dictionary<string, object?>
        {
            ["RequestMethod"] = context.Request.Method,
            ["RequestPath"] = context.Request.Path,
            ["StatusCode"] = status,
            ["TraceId"] = context.TraceIdentifier
        };

        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception while processing {RequestMethod} {RequestPath} responded {StatusCode} with trace {TraceId}",
                state["RequestMethod"], state["RequestPath"], status, state["TraceId"]);
            return;
        }

        logger.LogWarning(exception, "Handled exception while processing {RequestMethod} {RequestPath} responded {StatusCode} with trace {TraceId}",
            state["RequestMethod"], state["RequestPath"], status, state["TraceId"]);
    }
}
