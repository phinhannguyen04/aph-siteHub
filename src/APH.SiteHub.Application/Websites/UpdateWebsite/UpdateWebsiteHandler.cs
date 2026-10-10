using APH.SiteHub.Application.Abstractions;
namespace APH.SiteHub.Application.Websites;

public sealed class UpdateWebsiteHandler(IWebsiteRepository repository) : IHandler<UpdateWebsiteCommand, WebsiteResponse>
{
    public async Task<Result<WebsiteResponse>> HandleAsync(UpdateWebsiteCommand command, CancellationToken ct)
    {
        if (command.Name is null && command.Url is null && command.TagIds is null)
        {
            return Result<WebsiteResponse>.Failure(Error.Invalid("Provide a website name, URL or tags"));
        }
        var name = command.Name is null ? Result<string?>.Success(null) : Normalize.Required(command.Name, "website name", 160).Map(value => (string?)value);
        var url = command.Url is null ? Result<string?>.Success(null) : Normalize.Url(command.Url).Map(value => (string?)value);
        var tags = command.TagIds is null ? Result<string[]?>.Success(null) : Normalize.TagIds(command.TagIds).Map(value => (string[]?)value);
        if (ResultValidation.FirstFailure(name, url, tags) is { } error)
        {
            return Result<WebsiteResponse>.Failure(error);
        }
        var normalized = command with
        {
            Name = name.Value,
            Url = url.Value,
            TagIds = tags.Value
        };
        return (await repository.UpdateAsync(normalized, ct)).Bind(website => website is null
            ? Result<WebsiteResponse>.Failure(Error.Missing("Website")) : Result<WebsiteResponse>.Success(WebsiteResponse.From(website)));
    }
}
