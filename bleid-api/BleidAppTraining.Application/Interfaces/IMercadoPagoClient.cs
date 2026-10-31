namespace BleidAppTraining.Application.Interfaces;

public record CreatePreapprovalRequest(
    string PayerEmail,
    string BackUrl,
    string Reason,
    decimal AutoRecurringAmount,
    string CurrencyId = "ARS",
    string ExternalReference = ""
);

public record MercadoPagoPreapprovalResponse(
    string Id,
    string InitPoint,
    string Status,
    string PayerEmail,
    DateTime? NextPaymentDate,
    DateTime? DateCreated
);

public interface IMercadoPagoClient
{
    Task<MercadoPagoPreapprovalResponse> CreatePreapprovalAsync(CreatePreapprovalRequest request, CancellationToken ct = default);
    Task<MercadoPagoPreapprovalResponse?> GetPreapprovalAsync(string preapprovalId, CancellationToken ct = default);
    Task<bool> CancelPreapprovalAsync(string preapprovalId, CancellationToken ct = default);
}
