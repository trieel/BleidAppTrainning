namespace BleidAppTraining.Application.Common;

public sealed class ServiceValidationException(IReadOnlyCollection<string> errors) : Exception(string.Join(" ", errors))
{
    public IReadOnlyCollection<string> Errors { get; } = errors;

    public ServiceValidationException(string error) : this(new[] { error })
    {
    }
}
