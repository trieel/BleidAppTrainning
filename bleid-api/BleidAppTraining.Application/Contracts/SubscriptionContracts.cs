using BleidAppTraining.Domain.Enums;

namespace BleidAppTraining.Application.Contracts;

public record SubscriptionCheckoutResult(
    string InitPoint,
    string PreapprovalId
);

public record SubscriptionStatusResult(
    bool IsProActive,
    SubscriptionStatus? Status,
    DateTime? CurrentPeriodEnd
);

public record VerifySubscriptionCommand(
    string PreapprovalId
);

public record MercadoPagoWebhookDto(
    string? Action,
    string? ApiVersion,
    MercadoPagoWebhookDataDto? Data,
    DateTime? DateCreated,
    long? Id,
    bool? LiveMode,
    string? Type,
    long? UserId
);

public record MercadoPagoWebhookDataDto(
    string? Id
);
