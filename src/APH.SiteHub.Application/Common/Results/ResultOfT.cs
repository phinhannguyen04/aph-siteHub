namespace APH.SiteHub.Application;

public sealed class Result<T> : Result
{
    private readonly T? value;
    private Result(T? value, bool isSuccess, Error? error) : base(isSuccess, error) => this.value = value;
    public T Value => IsSuccess ? value! : throw new InvalidOperationException("A failed result has no value.");
    public static Result<T> Success(T value) => new(value, true, null);
    public new static Result<T> Failure(Error error) => new(default, false, error ?? throw new ArgumentNullException(nameof(error)));
    public Result<TNext> Map<TNext>(Func<T, TNext> map) => IsSuccess ? Result<TNext>.Success(map(Value)) : ToFailure<TNext>();
    public Result<TNext> Bind<TNext>(Func<T, Result<TNext>> bind) => IsSuccess ? bind(Value) : ToFailure<TNext>();
    public Task<Result<TNext>> BindAsync<TNext>(Func<T, Task<Result<TNext>>> bind) => IsSuccess ? bind(Value) : Task.FromResult(ToFailure<TNext>());
}
