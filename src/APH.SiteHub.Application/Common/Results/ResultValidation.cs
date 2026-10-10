namespace APH.SiteHub.Application;

public static class ResultValidation
{
    public static Error? FirstFailure(params Result[] results) => results.FirstOrDefault(result => result.IsFailure)?.Error;
}
