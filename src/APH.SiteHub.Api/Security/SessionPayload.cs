namespace APH.SiteHub.Api.Security;

public sealed record SessionPayload(long Exp, string Csrf, string Version);
