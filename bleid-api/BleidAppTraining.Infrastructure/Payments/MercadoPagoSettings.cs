namespace BleidAppTraining.Infrastructure.Payments;

public class MercadoPagoSettings
{
    public const string SectionName = "MercadoPago";

    public string AccessToken { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string BackUrl { get; set; } = "http://localhost:3000/subscription/callback";
    public decimal MonthlyPriceArs { get; set; } = 6500.00m;
}
