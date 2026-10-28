using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BleidAppTraining.API.Filters;

public sealed class RequestValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        var bodyArguments = context.ActionArguments
            .Where(argument => argument.Value is not null && argument.Value is not CancellationToken)
            .ToArray();

        foreach (var argument in bodyArguments)
        {
            if (argument.Value is null)
                continue;

            var validator = context.HttpContext.RequestServices
                .GetService(typeof(IValidator<>).MakeGenericType(argument.Value.GetType())) as IValidator;
            if (validator is null)
                continue;

            var validationContext = (IValidationContext)Activator.CreateInstance(
                typeof(ValidationContext<>).MakeGenericType(argument.Value.GetType()),
                argument.Value)!;

            var result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);
            if (result.IsValid)
                continue;

            foreach (var failure in result.Errors)
            {
                var field = string.IsNullOrEmpty(failure.PropertyName)
                    ? argument.Key
                    : bodyArguments.Length == 1
                        ? failure.PropertyName
                        : $"{argument.Key}.{failure.PropertyName}";

                if (!errors.TryGetValue(field, out var messages))
                {
                    messages = new List<string>();
                    errors[field] = messages;
                }

                if (!messages.Contains(failure.ErrorMessage))
                    messages.Add(failure.ErrorMessage);
            }
        }

        if (errors.Count == 0)
        {
            await next();
            return;
        }

        context.Result = new ObjectResult(new ValidationProblemDetails(errors.ToDictionary(
                entry => entry.Key,
                entry => entry.Value.ToArray()))
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred.",
            Type = "https://datatracker.ietf.org/doc/html/rfc9457",
            Instance = context.HttpContext.Request.Path
        })
        {
            StatusCode = StatusCodes.Status400BadRequest,
            ContentTypes = { "application/problem+json" }
        };
    }
}
