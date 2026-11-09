using System.Data.Common;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Application.Websites;
using APH.SiteHub.Domain;
using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class WebsiteRepository(DbSession session, DatabaseOperation database) : IWebsiteRepository
{
    private const string Columns = "website_id AS id, name, url, search_text, created_at, updated_at";

    private sealed class WebsiteRow
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string Url { get; set; } = "";
        public string SearchText { get; set; } = "";
        public string CreatedAt { get; set; } = "";
        public string UpdatedAt { get; set; } = "";
        public int TotalCount { get; set; }
        public Website ToWebsite() => new() { Id = Id, Name = Name, Url = Url, SearchText = SearchText, CreatedAt = CreatedAt, UpdatedAt = UpdatedAt };
    }

    private sealed class LinkRow
    {
        public string WebsiteId { get; set; } = "";
        public int Position { get; set; }
        public string TagId { get; set; } = "";
        public string TagName { get; set; } = "";
        public string TagNameKey { get; set; } = "";
        public string? TagDescription { get; set; }
        public string TagColor { get; set; } = "";
        public string TagCreatedAt { get; set; } = "";
        public string TagUpdatedAt { get; set; } = "";
    }

    public Task<Result<bool>> DeleteAsync(string id, CancellationToken ct) => database.ExecuteAsync<bool>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        // website_tags rows are removed by ON DELETE CASCADE.
        return Result<bool>.Success(await connection.ExecuteAsync(Sql.Command("DELETE FROM websites WHERE website_id = :id", new { id }, null, ct)) > 0);

    }, ct);

    public Task<Result<WebsitePage>> ListAsync(ListWebsitesQuery query, CancellationToken ct) => database.ExecuteAsync<WebsitePage>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        var parameters = new DynamicParameters();
        var where = new List<string>();
        if (query.Search.Length > 0)
        {
            where.Add("w.search_text LIKE :search ESCAPE '\\'");
            parameters.Add("search", "%" + Sql.EscapeLike(Normalize.Fold(query.Search)) + "%", System.Data.DbType.AnsiString);
        }
        if (query.TagIds is { Length: > 0 })
        {
            var (placeholders, _) = Sql.InList("tag", query.TagIds, parameters);
            where.Add($"EXISTS (SELECT 1 FROM website_tags l WHERE l.website_id = w.website_id AND l.tag_id IN ({placeholders}))");
        }
        var filter = where.Count == 0 ? "" : " WHERE " + string.Join(" AND ", where);
        parameters.Add("skip", (query.Page - 1) * query.PageSize);
        parameters.Add("take", query.PageSize);
        // One statement: Oracle read consistency makes the total and the page agree without a READ ONLY
        // transaction (which can fail with ORA-01466 right after DDL).
        var rows = (await connection.QueryAsync<WebsiteRow>(Sql.Command(
            $"""
            SELECT w.website_id AS id, w.name, w.url, w.search_text, w.created_at, w.updated_at, COUNT(*) OVER () AS total_count
            FROM websites w{filter}
            ORDER BY w.created_at DESC, w.website_id DESC
            OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY
            """,
            parameters,
            null,
            ct
        ))).ToList();
        var websites = rows.Select(x => x.ToWebsite()).ToList();
        // An out-of-range page returns no rows, so the window total is unavailable; count separately.
        var total = rows.Count > 0
            ? rows[0].TotalCount
            : await connection.ExecuteScalarAsync<int>(Sql.Command($"SELECT COUNT(*) FROM websites w{filter}", parameters, null, ct));
        await LoadLinksAsync(connection, websites, null, ct);
        return Result<WebsitePage>.Success(new(
            websites.Select(WebsiteResponse.From).ToArray(),
            total,
            query.Page,
            query.PageSize
        ));

    }, ct);
    public Task<Result<int>> CountAsync(CancellationToken ct) => database.ExecuteAsync<int>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        return Result<int>.Success(await connection.ExecuteScalarAsync<int>(Sql.Command("SELECT COUNT(*) FROM websites", null, null, ct)));

    }, ct);
    public Task<Result<Website>> CreateAsync(
        Website website,
        string[] tags,
        CancellationToken ct
    ) => database.ExecuteAsync<Website>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        await connection.ExecuteAsync(Sql.Command(
            "INSERT INTO websites (website_id, name, url, search_text, created_at, updated_at) VALUES (:id, :name, :url, :searchText, :createdAt, :updatedAt)",
            new { id = website.Id, name = website.Name, url = website.Url, searchText = website.SearchText, createdAt = website.CreatedAt, updatedAt = website.UpdatedAt },
            tx,
            ct
        ));
        await InsertLinksAsync(connection, website.Id, tags, tx, ct);
        website.Links = [];
        await LoadLinksAsync(connection, [website], tx, ct);
        await tx.CommitAsync(ct);
        return Result<Website>.Success(website);

    }, ct);
    public Task<Result<Website?>> UpdateAsync(UpdateWebsiteCommand command, CancellationToken ct) => database.ExecuteAsync<Website?>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        await using var tx = await connection.BeginTransactionAsync(ct);
        var row = await connection.QuerySingleOrDefaultAsync<Website>(Sql.Command($"SELECT {Columns} FROM websites WHERE website_id = :id FOR UPDATE", new { id = command.Id }, tx, ct));
        if (row is null)
        {
            return Result<Website?>.Success(null);
        }
        row.Name = command.Name ?? row.Name;
        row.Url = command.Url ?? row.Url;
        row.SearchText = Normalize.Fold(row.Name + " " + row.Url);
        row.UpdatedAt = Normalize.Timestamp();
        await connection.ExecuteAsync(Sql.Command(
            "UPDATE websites SET name = :name, url = :url, search_text = :searchText, updated_at = :updatedAt WHERE website_id = :id",
            new { id = row.Id, name = row.Name, url = row.Url, searchText = row.SearchText, updatedAt = row.UpdatedAt },
            tx,
            ct
        ));
        if (command.TagIds is not null)
        {
            await connection.ExecuteAsync(Sql.Command("DELETE FROM website_tags WHERE website_id = :id", new { id = row.Id }, tx, ct));
            await InsertLinksAsync(connection, row.Id, command.TagIds, tx, ct);
        }
        await LoadLinksAsync(connection, [row], tx, ct);
        await tx.CommitAsync(ct);
        return Result<Website?>.Success(row);

    }, ct);

    private static async Task InsertLinksAsync(
        DbConnection connection,
        string websiteId,
        IReadOnlyList<string> tagIds,
        DbTransaction tx,
        CancellationToken ct
    )
    {
        // A missing tag raises ORA-02291, which the database boundary reports as a validation error.
        foreach (var (tagId, position) in tagIds.Select((id, index) => (id, index)))
        {
            await connection.ExecuteAsync(Sql.Command(
                "INSERT INTO website_tags (website_id, tag_id, position) VALUES (:websiteId, :tagId, :position)",
                new { websiteId, tagId, position },
                tx,
                ct
            ));
        }
    }

    private static async Task LoadLinksAsync(
        DbConnection connection,
        IReadOnlyList<Website> websites,
        DbTransaction? tx,
        CancellationToken ct
    )
    {
        if (websites.Count == 0)
        {
            return;
        }
        var (placeholders, parameters) = Sql.InList("site", websites.Select(x => x.Id).ToArray());
        var rows = await connection.QueryAsync<LinkRow>(Sql.Command(
            $"""
            SELECT l.website_id, l.position, t.tag_id, t.name AS tag_name, t.name_key AS tag_name_key,
                   t.description AS tag_description, t.color AS tag_color, t.created_at AS tag_created_at, t.updated_at AS tag_updated_at
            FROM website_tags l JOIN tags t ON t.tag_id = l.tag_id
            WHERE l.website_id IN ({placeholders})
            ORDER BY l.website_id, l.position
            """,
            parameters,
            tx,
            ct
        ));
        var bySite = rows.ToLookup(x => x.WebsiteId);
        foreach (var website in websites)
        {
            website.Links = bySite[website.Id].Select(x => new WebsiteTag
            {
                WebsiteId = x.WebsiteId,
                TagId = x.TagId,
                Position = x.Position,
                Tag = new Tag
                {
                    Id = x.TagId,
                    Name = x.TagName,
                    NameKey = x.TagNameKey,
                    Description = x.TagDescription ?? "",
                    Color = x.TagColor,
                    CreatedAt = x.TagCreatedAt,
                    UpdatedAt = x.TagUpdatedAt
                }
            }).ToList();
        }
    }
}
