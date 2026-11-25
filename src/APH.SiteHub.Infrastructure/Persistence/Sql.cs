using System.Data.Common;
using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

/// <summary>Dapper defaults and helpers shared by every PostgreSQL repository.</summary>
internal static class Sql
{
    static Sql()
    {
        // Columns are snake_case; row classes are PascalCase.
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public static CommandDefinition Command(
        string sql,
        object? parameters,
        DbTransaction? transaction,
        CancellationToken ct
    ) => new(
        sql,
        parameters,
        transaction,
        cancellationToken: ct
    );

    /// <summary>Escapes LIKE wildcards; use with <c>ESCAPE '\'</c>.</summary>
    public static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}
