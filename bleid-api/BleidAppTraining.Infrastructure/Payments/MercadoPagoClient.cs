using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BleidAppTraining.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BleidAppTraining.Infrastructure.Payments;

public class MercadoPagoClient : IMercadoPagoClient
{
    private readonly HttpClient _httpClient;
    private readonly MercadoPagoSettings _settings;
    private readonly ILogger<MercadoPagoClient> _logger;

    public MercadoPagoClient(
        HttpClient httpClient,
        IOptions<MercadoPagoSettings> settings,
        ILogger<MercadoPagoClient> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        if (_httpClient.BaseAddress is null)
        {
            _httpClient.BaseAddress = new Uri("https://api.mercadopago.com/");
        }

        if (!string.IsNullOrWhiteSpace(_settings.AccessToken) && _settings.AccessToken != "TEST-dummy-token")
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _settings.AccessToken);
        }
    }

    public async Task<MercadoPagoPreapprovalResponse> CreatePreapprovalAsync(
        CreatePreapprovalRequest request,
        CancellationToken ct = default)
    {
        // Support test mock mode when running with local test dummy token
        if (string.IsNullOrWhiteSpace(_settings.AccessToken) || _settings.AccessToken.StartsWith("TEST-dummy", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("MercadoPagoClient in MOCK mode: generating simulated preapproval for {Email}", request.PayerEmail);
            var mockId = "mock_preapproval_" + Guid.NewGuid().ToString("N")[..12];
            var mockInitPoint = $"{request.BackUrl}?preapproval_id={mockId}&status=approved";
            return new MercadoPagoPreapprovalResponse(
                mockId,
                mockInitPoint,
                "authorized",
                request.PayerEmail,
                DateTime.UtcNow.AddMonths(1),
                DateTime.UtcNow
            );
        }

        var payload = new
        {
            payer_email = request.PayerEmail,
            back_url = request.BackUrl,
            reason = request.Reason,
            external_reference = request.ExternalReference,
            auto_recurring = new
            {
                frequency = 1,
                frequency_type = "months",
                transaction_amount = request.AutoRecurringAmount,
                currency_id = request.CurrencyId
            }
        };

        var response = await _httpClient.PostAsJsonAsync("preapproval", payload, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Mercado Pago preapproval creation failed: {StatusCode} {Error}", response.StatusCode, errorBody);
            throw new HttpRequestException($"Error creating Mercado Pago subscription: {response.StatusCode} - {errorBody}");
        }

        var result = await response.Content.ReadFromJsonAsync<MpPreapprovalDto>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Failed to deserialize Mercado Pago response.");

        return new MercadoPagoPreapprovalResponse(
            result.Id,
            result.InitPoint,
            result.Status,
            result.PayerEmail,
            result.NextPaymentDate,
            result.DateCreated
        );
    }

    public async Task<MercadoPagoPreapprovalResponse?> GetPreapprovalAsync(
        string preapprovalId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.AccessToken) || _settings.AccessToken.StartsWith("TEST-dummy", StringComparison.OrdinalIgnoreCase))
        {
            return new MercadoPagoPreapprovalResponse(
                preapprovalId,
                $"{_settings.BackUrl}?preapproval_id={preapprovalId}",
                "authorized",
                "mock-user@bleidapp.com",
                DateTime.UtcNow.AddMonths(1),
                DateTime.UtcNow
            );
        }

        var response = await _httpClient.GetAsync($"preapproval/{preapprovalId}", ct);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Mercado Pago get preapproval failed: {StatusCode} {Error}", response.StatusCode, errorBody);
            throw new HttpRequestException($"Error querying Mercado Pago subscription: {response.StatusCode}");
        }

        var result = await response.Content.ReadFromJsonAsync<MpPreapprovalDto>(cancellationToken: ct);
        if (result is null) return null;

        return new MercadoPagoPreapprovalResponse(
            result.Id,
            result.InitPoint,
            result.Status,
            result.PayerEmail,
            result.NextPaymentDate,
            result.DateCreated
        );
    }

    public async Task<bool> CancelPreapprovalAsync(
        string preapprovalId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.AccessToken) || _settings.AccessToken.StartsWith("TEST-dummy", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var response = await _httpClient.PutAsJsonAsync($"preapproval/{preapprovalId}", new { status = "cancelled" }, ct);
        return response.IsSuccessStatusCode;
    }

    private class MpPreapprovalDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("init_point")]
        public string InitPoint { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("payer_email")]
        public string PayerEmail { get; set; } = string.Empty;

        [JsonPropertyName("next_payment_date")]
        public DateTime? NextPaymentDate { get; set; }

        [JsonPropertyName("date_created")]
        public DateTime? DateCreated { get; set; }
    }
}
