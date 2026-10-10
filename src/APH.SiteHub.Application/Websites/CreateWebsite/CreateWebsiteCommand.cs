namespace APH.SiteHub.Application.Websites;

public sealed record CreateWebsiteCommand(string? Name, string? Url, string[]? TagIds);
