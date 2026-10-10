namespace APH.SiteHub.Application;

public class Result
{
    private readonly Error? error;
    protected Result(bool isSuccess, Error? error)
    {
        if (isSuccess == (error is not null))
        {
            throw new ArgumentException("Success cannot carry an error; failure requires an error.");
        }
        IsSuccess = isSuccess;
        this.error = error;
    }
    public bool IsSuccess
    {
        get;
    }
    public bool IsFailure => !IsSuccess;
    public Error Error => IsFailure ? error! : throw new InvalidOperationException("A successful result has no error.");
    public static Result Success() => new(true, null);
    public static Result Failure(Error error) => new(false, error ?? throw new ArgumentNullException(nameof(error)));
    public Result<T> ToFailure<T>() => IsFailure ? Result<T>.Failure(Error) : throw new InvalidOperationException("Only a failure can be propagated.");
}
