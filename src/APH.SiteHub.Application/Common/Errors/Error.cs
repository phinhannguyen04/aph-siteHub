namespace APH.SiteHub.Application;

public sealed record Error(string Code, string Message, ErrorType Type)
{
    public static Error Invalid(string message) => new("VALIDATION_ERROR", message, ErrorType.Validation);
    public static Error Missing(string resource) => new("NOT_FOUND", $"{resource} not found", ErrorType.NotFound);
    public static Error Unauthorized(string message = "Please sign in") => new("UNAUTHORIZED", message, ErrorType.Unauthorized);
    public static Error Forbidden(string message) => new("FORBIDDEN", message, ErrorType.Forbidden);
    public static Error Conflict(string message) => new("CONFLICT", message, ErrorType.Conflict);
    public static Error Configuration(string message) => new("CONFIGURATION_ERROR", message, ErrorType.Configuration);
    public static Error Unexpected() => new("INTERNAL_ERROR", "Internal server error", ErrorType.Unexpected);
}
