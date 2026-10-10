using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
namespace APH.SiteHub.Application.Websites;

public sealed class CreateWebsiteHandler(IWebsiteRepository repository) : IHandler<CreateWebsiteCommand, WebsiteResponse>
{
    public async Task<Result<WebsiteResponse>> HandleAsync(CreateWebsiteCommand command, CancellationToken ct)
    {
        var name = Normalize.Required(command.Name, "website name", 160);
        var url = Normalize.Url(command.Url);
        var tags = Normalize.TagIds(command.TagIds);
        if (ResultValidation.FirstFailure(name, url, tags) is { } error)
        {
            return Result<WebsiteResponse>.Failure(error);
        }
        var time = Normalize.Timestamp();
        var website = new Website { Name = name.Value, Url = url.Value, SearchText = Normalize.Fold(name.Value + " " + url.Value), CreatedAt = time, UpdatedAt = time };
        return (await repository.CreateAsync(website, tags.Value, ct)).Map(WebsiteResponse.From);
    }
}
