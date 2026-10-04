namespace BleidAppTraining.Application.Common;

public sealed class ServiceValidationException(IReadOnlyCollection<string> errors) : Exception
{
    public IReadOnlyCollection<string> Errors { get; } = errors;

    public ServiceValidationException(string error) : this(new[] { error })
    {
    }
}
