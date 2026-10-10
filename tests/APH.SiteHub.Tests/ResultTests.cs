using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Application.Websites;
using APH.SiteHub.Domain;
using APH.SiteHub.Infrastructure.Persistence;
using APH.SiteHub.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Xunit;

namespace APH.SiteHub.Tests;

public sealed class ResultTests
{
    [Fact]
    public async Task FailureSkipsMappingAndAsyncContinuation()
    {
        var error = Error.Conflict("Existing record");
        var failure = Result<int>.Failure(error);
        var called = false;
        var mapped = failure.Map(value => { called = true; return value.ToString(); });
        var bound = await failure.BindAsync(value => { called = true; return Task.FromResult(Result<string>.Success(value.ToString())); });
        Assert.False(called);
        Assert.Same(error, mapped.Error);
        Assert.Same(error, bound.Error);
        Assert.Throws<InvalidOperationException>(() => failure.Value);
        Assert.Throws<InvalidOperationException>(() => Result<int>.Success(1).Error);
        Assert.Throws<ArgumentNullException>(() => Result<int>.Failure(null!));
    }

    [Fact]
    public async Task ValidationFailurePreventsWritesAndRepositoryFailurePropagates()
    {
        var repository = new TrackingWebsiteRepository();
        var handler = new CreateWebsiteHandler(repository);
        var invalid = await handler.HandleAsync(new("Website", "javascript:alert(1)", []), CancellationToken.None);
        Assert.Equal(ErrorType.Validation, invalid.Error.Type);
        Assert.Equal(0, repository.Creates);
        var conflict = await handler.HandleAsync(new("Website", "https://example.com", []), CancellationToken.None);
        Assert.Same(repository.Failure, conflict.Error);
        Assert.Equal(1, repository.Creates);
    }

    [Fact]
    public async Task MissingRecordBecomesNotFoundInApplication()
    {
        var result = await new UpdateWebsiteHandler(new TrackingWebsiteRepository())
            .HandleAsync(new("missing", "Updated", null, null), CancellationToken.None);
        Assert.Equal("NOT_FOUND", result.Error.Code);
    }

    [Theory]
    [InlineData("23505", ErrorType.Conflict)]
    [InlineData("23503", ErrorType.Validation)]
    public async Task DatabaseBoundaryTranslatesNestedConstraintErrors(string sqlState, ErrorType expected)
    {
        var database = new DatabaseOperation(NullLogger<DatabaseOperation>.Instance);
        var exception = new DbUpdateException("Sensitive database detail", new PostgresException("Sensitive record", "ERROR", "ERROR", sqlState));
        var result = await database.ExecuteAsync<int>(() => Task.FromException<Result<int>>(exception), CancellationToken.None);
        Assert.Equal(expected, result.Error.Type);
        Assert.DoesNotContain("Sensitive", result.Error.Message);
    }

    [Fact]
    public async Task DatabaseBoundaryHidesUnexpectedDetails()
    {
        var database = new DatabaseOperation(NullLogger<DatabaseOperation>.Instance);
        var result = await database.ExecuteAsync<int>(() => Task.FromException<Result<int>>(new InvalidOperationException("credential-secret")), CancellationToken.None);
        Assert.Equal("INTERNAL_ERROR", result.Error.Code);
        Assert.Equal("Internal server error", result.Error.Message);
    }

    [Fact]
    public async Task CancellationPropagatesWithoutBecomingFailure()
    {
        var database = new DatabaseOperation(NullLogger<DatabaseOperation>.Instance);
        using var source = new CancellationTokenSource();
        source.Cancel();
        var called = false;
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => database.ExecuteAsync<int>(() => { called = true; return Task.FromResult(Result<int>.Success(1)); }, source.Token));
        Assert.False(called);
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => database.ExecuteAsync<int>(() => Task.FromException<Result<int>>(new TaskCanceledException()), CancellationToken.None));
    }

    [Fact]
    public void MissingKeyAndTamperedEnvelopeAreFailures()
    {
        var missing = new SecretProtector(SecurityTests.Options with
        {
            EncryptionKey = null
        });
        Assert.Equal(ErrorType.Configuration, missing.Encrypt("account", "secret").Error.Type);
        var protector = new SecretProtector(SecurityTests.Options);
        Assert.Equal(ErrorType.Unexpected, protector.Decrypt("account", "invalid-envelope").Error.Type);
    }

    [Theory]
    [InlineData(ErrorType.Validation, 400)]
    [InlineData(ErrorType.Unauthorized, 401)]
    [InlineData(ErrorType.Forbidden, 403)]
    [InlineData(ErrorType.NotFound, 404)]
    [InlineData(ErrorType.Conflict, 409)]
    [InlineData(ErrorType.PayloadTooLarge, 413)]
    [InlineData(ErrorType.RateLimited, 429)]
    [InlineData(ErrorType.Unavailable, 503)]
    [InlineData(ErrorType.Configuration, 500)]
    [InlineData(ErrorType.Unexpected, 500)]
    public void HttpBoundaryMapsErrorCategories(ErrorType type, int status) =>
        Assert.Equal(status, ErrorHttpMapper.StatusCode(new("TEST_ERROR", "Message", type)));

    private sealed class TrackingWebsiteRepository : IWebsiteRepository
    {
        public Error Failure { get; } = Error.Conflict("Existing record");
        public int Creates
        {
            get; private set;
        }
        public Task<Result<Website>> CreateAsync(Website website, string[] tags, CancellationToken ct)
        {
            Creates++;
            return Task.FromResult(Result<Website>.Failure(Failure));
        }
        public Task<Result<Website?>> UpdateAsync(UpdateWebsiteCommand command, CancellationToken ct) => Task.FromResult(Result<Website?>.Success(null));
        public Task<Result<int>> CountAsync(CancellationToken ct) => Task.FromResult(Result<int>.Success(0));
        public Task<Result<WebsitePage>> ListAsync(ListWebsitesQuery query, CancellationToken ct) => Task.FromResult(Result<WebsitePage>.Success(new([], 0, query.Page, query.PageSize)));
    }
}
