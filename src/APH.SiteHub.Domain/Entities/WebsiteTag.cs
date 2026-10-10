namespace APH.SiteHub.Domain;

public sealed class WebsiteTag
{
    public string WebsiteId { get; set; } = "";
    public string TagId { get; set; } = "";
    public int Position
    {
        get; set;
    }
    public Tag Tag { get; set; } = null!;
}
