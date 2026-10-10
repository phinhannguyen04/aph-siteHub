namespace APH.SiteHub.Api.Contracts;

public sealed record RequestField(string Name, RequestFieldType Type = RequestFieldType.Text, bool Required = false, bool AllowNull = false);
