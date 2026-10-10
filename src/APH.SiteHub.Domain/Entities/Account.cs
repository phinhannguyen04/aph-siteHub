namespace APH.SiteHub.Domain;

public sealed class Account
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Provider { get; set; } = "";
    public string LoginName { get; set; } = "";
    public string ExternalAccountId { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string SecretKeyEncrypted { get; set; } = "";
    public bool IsLimit
    {
        get; set;
    }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
