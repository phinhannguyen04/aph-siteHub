namespace APH.SiteHub.Application.Websites;

public sealed record ListWebsitesQuery(int Page = 1, int PageSize = 12, string Search = "", string[]? TagIds = null);
