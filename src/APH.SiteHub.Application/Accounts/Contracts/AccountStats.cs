namespace APH.SiteHub.Application.Accounts;

public sealed record AccountStats(int Total, int Limited, int Unlimited, ProviderStats[] Providers);
