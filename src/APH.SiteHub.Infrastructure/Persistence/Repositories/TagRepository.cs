using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class TagRepository(SiteHubDbContext db, DatabaseOperation database) : ITagRepository
{
    public Task<Result<List<Tag>>> ListAsync(CancellationToken ct) => database.ExecuteAsync<List<Tag>>(async () => Result<List<Tag>>.Success(await db.Tags.AsNoTracking().OrderBy(x => x.NameKey).ToListAsync(ct)), ct);
    public Task<Result<Tag>> SaveAsync(Tag tag, bool create, CancellationToken ct) => database.ExecuteAsync<Tag>(async () =>
    {
        if (create)
        {
            db.Tags.Add(tag);
            await db.SaveChangesAsync(ct);
            return Result<Tag>.Success(tag);
        }
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var row = await db.Tags.FromSqlInterpolated($"SELECT * FROM tags WHERE tag_id = {tag.Id} FOR UPDATE").SingleOrDefaultAsync(ct);
        if (row is null)
        {
            return Result<Tag>.Failure(Error.Missing("Tag"));
        }
        row.Name = tag.Name;
        row.NameKey = tag.NameKey;
        row.Description = tag.Description;
        row.Color = tag.Color;
        row.UpdatedAt = tag.UpdatedAt;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Result<Tag>.Success(row);

    }, ct);
    public Task<Result<bool>> DeleteAsync(string id, CancellationToken ct) => database.ExecuteAsync<bool>(async () => Result<bool>.Success(await db.Tags.Where(x => x.Id == id).ExecuteDeleteAsync(ct) > 0), ct);
}
