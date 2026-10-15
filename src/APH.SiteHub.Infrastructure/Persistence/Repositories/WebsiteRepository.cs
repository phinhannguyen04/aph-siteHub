using System.Data;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Application.Websites;
using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class WebsiteRepository(SiteHubDbContext db, DatabaseOperation database) : IWebsiteRepository
{
    public Task<Result<WebsitePage>> ListAsync(ListWebsitesQuery query, CancellationToken ct) => database.ExecuteAsync<WebsitePage>(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, ct);
        await db.Database.ExecuteSqlRawAsync("SET TRANSACTION READ ONLY", ct);
        var rows = db.Websites.AsNoTracking();
        if (query.Search.Length > 0)
        {
            var search = Normalize.Fold(query.Search);
            rows = rows.Where(x => x.SearchText.Contains(search));
        }
        if (query.TagIds is { Length: > 0 })
        {
            rows = rows.Where(x => x.Links.Any(link => query.TagIds.Contains(link.TagId)));
        }
        var total = await rows.CountAsync(ct);
        var websites = await rows.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).Include(x => x.Links).ThenInclude(x => x.Tag).ToListAsync(ct);
        await tx.CommitAsync(ct);
        return Result<WebsitePage>.Success(new(websites.Select(WebsiteResponse.From).ToArray(), total, query.Page, query.PageSize));

    }, ct);
    public Task<Result<int>> CountAsync(CancellationToken ct) => database.ExecuteAsync<int>(async () => Result<int>.Success(await db.Websites.CountAsync(ct)), ct);
    public Task<Result<Website>> CreateAsync(Website website, string[] tags, CancellationToken ct) => database.ExecuteAsync<Website>(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        db.Websites.Add(website);
        website.Links = tags.Select((id, position) => new WebsiteTag { WebsiteId = website.Id, TagId = id, Position = position }).ToList();
        await db.SaveChangesAsync(ct);
        await db.Entry(website).Collection(x => x.Links).Query().Include(x => x.Tag).LoadAsync(ct);
        await tx.CommitAsync(ct);
        return Result<Website>.Success(website);

    }, ct);
    public Task<Result<Website?>> UpdateAsync(UpdateWebsiteCommand command, CancellationToken ct) => database.ExecuteAsync<Website?>(async () =>
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var row = await db.Websites.FromSqlInterpolated($"SELECT * FROM websites WHERE website_id = {command.Id} FOR UPDATE").SingleOrDefaultAsync(ct);
        if (row is null)
        {
            return Result<Website?>.Success(null);
        }
        row.Name = command.Name ?? row.Name;
        row.Url = command.Url ?? row.Url;
        row.SearchText = Normalize.Fold(row.Name + " " + row.Url);
        row.UpdatedAt = Normalize.Timestamp();
        if (command.TagIds is not null)
        {
            await db.WebsiteTags.Where(x => x.WebsiteId == command.Id).ExecuteDeleteAsync(ct);
            row.Links = command.TagIds.Select((id, position) => new WebsiteTag { WebsiteId = row.Id, TagId = id, Position = position }).ToList();
        }
        await db.SaveChangesAsync(ct);
        await db.Entry(row).Collection(x => x.Links).Query().Include(x => x.Tag).LoadAsync(ct);
        await tx.CommitAsync(ct);
        return Result<Website?>.Success(row);

    }, ct);
}
