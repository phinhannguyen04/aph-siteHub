namespace APH.SiteHub.Application.Tags;

public sealed record SaveTagCommand(string? Id, string? Name, string? Description, string? Color);
