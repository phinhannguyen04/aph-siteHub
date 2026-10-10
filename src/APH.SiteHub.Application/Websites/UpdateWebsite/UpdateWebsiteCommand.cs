namespace APH.SiteHub.Application.Websites;

public sealed record UpdateWebsiteCommand(string Id, string? Name, string? Url, string[]? TagIds);
