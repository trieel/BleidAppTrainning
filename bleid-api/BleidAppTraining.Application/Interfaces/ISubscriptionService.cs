using BleidAppTraining.Application.Contracts;

namespace BleidAppTraining.Application.Interfaces;

public interface ISubscriptionService
{
    Task<SubscriptionCheckoutResult> CreateCheckoutSessionAsync(Guid userId, CancellationToken ct = default);
    Task<SubscriptionStatusResult> VerifySessionAsync(Guid userId, string preapprovalId, CancellationToken ct = default);
    Task<SubscriptionStatusResult> GetStatusAsync(Guid userId, CancellationToken ct = default);
    Task<bool> CancelAsync(Guid userId, CancellationToken ct = default);
    Task<bool> HandleWebhookAsync(MercadoPagoWebhookDto dto, string? signature, CancellationToken ct = default);
    Task EnforceDowngradeAsync(Guid userId, CancellationToken ct = default);
}
