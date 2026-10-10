using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
namespace APH.SiteHub.Application.Tags;

public sealed class SaveTagHandler(ITagRepository repository) : IHandler<SaveTagCommand, TagResponse>
{
    public async Task<Result<TagResponse>> HandleAsync(SaveTagCommand command, CancellationToken ct)
    {
        var name = Normalize.Required(command.Name, "tag name", 256).Bind(value => Normalize.Required(value.TrimStart('#').Trim(), "tag name", 64));
        var description = command.Description?.Trim() ?? "";
        var color = Normalize.Color(command.Color);
        if (name.IsFailure)
        {
            return name.ToFailure<TagResponse>();
        }
        if (description.Length > 240)
        {
            return Result<TagResponse>.Failure(Error.Invalid("Description must be at most 240 characters"));
        }
        if (color.IsFailure)
        {
            return color.ToFailure<TagResponse>();
        }
        var time = Normalize.Timestamp();
        var tag = new Tag
        {
            Id = command.Id ?? Guid.NewGuid().ToString(),
            Name = name.Value,
            NameKey = name.Value.ToLowerInvariant(),
            Description = description,
            Color = color.Value,
            CreatedAt = time,
            UpdatedAt = time
        };
        return (await repository.SaveAsync(tag, command.Id is null, ct)).Map(TagResponse.From);
    }
}
