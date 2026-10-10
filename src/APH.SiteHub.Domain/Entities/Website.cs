namespace APH.SiteHub.Domain;

public sealed class Website
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Url { get; set; } = "";
    public string SearchText { get; set; } = "";
    public string CreatedAt { get; set; } = "";
    public string UpdatedAt { get; set; } = "";
    public List<WebsiteTag> Links { get; set; } = [];
}
