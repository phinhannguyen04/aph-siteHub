using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class TagRepository(DbSession session, DatabaseOperation database) : ITagRepository
{
    internal const string Columns = "tag_id AS id, name, name_key, description, color, created_at, updated_at";

    // Oracle stores '' as NULL: an empty description is written as NULL and read back as "".
    private static object? Blank(string value) => value.Length == 0 ? null : value;

    public Task<Result<List<Tag>>> ListAsync(CancellationToken ct) => database.ExecuteAsync<List<Tag>>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        var rows = await connection.QueryAsync<Tag>(Sql.Command($"SELECT {Columns} FROM tags ORDER BY name_key", null, null, ct));
        return Result<List<Tag>>.Success(rows.ToList());

    }, ct);
    public Task<Result<Tag>> SaveAsync(
        Tag tag,
        bool create,
        CancellationToken ct
    ) => database.ExecuteAsync<Tag>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        if (create)
        {
            await connection.ExecuteAsync(Sql.Command(
                "INSERT INTO tags (tag_id, name, name_key, description, color, created_at, updated_at) VALUES (:id, :name, :nameKey, :description, :color, :createdAt, :updatedAt)",
                new { id = tag.Id, name = tag.Name, nameKey = tag.NameKey, description = Blank(tag.Description), color = tag.Color, createdAt = tag.CreatedAt, updatedAt = tag.UpdatedAt },
                null,
                ct
            ));
            return Result<Tag>.Success(tag);
        }
        await using var tx = await connection.BeginTransactionAsync(ct);
        var row = await connection.QuerySingleOrDefaultAsync<Tag>(Sql.Command($"SELECT {Columns} FROM tags WHERE tag_id = :id FOR UPDATE", new { id = tag.Id }, tx, ct));
        if (row is null)
        {
            return Result<Tag>.Failure(Error.Missing("Tag"));
        }
        row.Name = tag.Name;
        row.NameKey = tag.NameKey;
        row.Description = tag.Description;
        row.Color = tag.Color;
        row.UpdatedAt = tag.UpdatedAt;
        await connection.ExecuteAsync(Sql.Command(
            "UPDATE tags SET name = :name, name_key = :nameKey, description = :description, color = :color, updated_at = :updatedAt WHERE tag_id = :id",
            new { id = row.Id, name = row.Name, nameKey = row.NameKey, description = Blank(row.Description), color = row.Color, updatedAt = row.UpdatedAt },
            tx,
            ct
        ));
        await tx.CommitAsync(ct);
        return Result<Tag>.Success(row);

    }, ct);
    public Task<Result<bool>> DeleteAsync(string id, CancellationToken ct) => database.ExecuteAsync<bool>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        return Result<bool>.Success(await connection.ExecuteAsync(Sql.Command("DELETE FROM tags WHERE tag_id = :id", new { id }, null, ct)) > 0);

    }, ct);
}
