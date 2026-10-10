namespace APH.SiteHub.Domain;

public sealed class Tag
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string NameKey { get; set; } = "";
    public string Description { get; set; } = "";
    public string Color { get; set; } = "";
    public string CreatedAt { get; set; } = "";
    public string UpdatedAt { get; set; } = "";
}
