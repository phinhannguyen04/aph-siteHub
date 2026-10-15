namespace APH.SiteHub.Application.Websites;

public sealed record WebsitePage(WebsiteResponse[] Websites, int Total, int Page, [property: System.Text.Json.Serialization.JsonPropertyName("pageSize")] int PageSize);
