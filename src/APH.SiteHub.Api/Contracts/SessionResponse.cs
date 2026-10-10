namespace APH.SiteHub.Api.Contracts;

public sealed record SessionResponse([property: System.Text.Json.Serialization.JsonPropertyName("csrfToken")] string CsrfToken);
