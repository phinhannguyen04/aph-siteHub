namespace APH.SiteHub.Application;

public enum ErrorType
{
    Validation, NotFound, Unauthorized, Forbidden, Conflict, RateLimited,
    Configuration, Unavailable, Unexpected, PayloadTooLarge
}
