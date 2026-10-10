namespace APH.SiteHub.Domain;

public sealed class AdminCredential
{
    public string Id { get; set; } = "primary";
    public string PasswordHash { get; set; } = "";
    public string Version { get; set; } = Guid.NewGuid().ToString();
}
