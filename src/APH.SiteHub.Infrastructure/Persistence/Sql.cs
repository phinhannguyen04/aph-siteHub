using System.Data;
using System.Data.Common;
using Dapper;
using Oracle.ManagedDataAccess.Client;
namespace APH.SiteHub.Infrastructure.Persistence;

/// <summary>Dapper defaults and helpers shared by every Oracle repository.</summary>
internal static class Sql
{
    static Sql()
    {
        // Columns are snake_case; row classes are PascalCase.
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        // Bind strings as VARCHAR2 so comparisons against VARCHAR2 columns can use indexes.
        SqlMapper.AddTypeMap(typeof(string), DbType.AnsiString);
    }

    public static CommandDefinition Command(
        string sql,
        object? parameters,
        DbTransaction? transaction,
        CancellationToken ct
    ) => new(
        sql,
        parameters is null ? null : new OracleParameters(parameters),
        transaction,
        cancellationToken: ct
    );

    /// <summary>Escapes LIKE wildcards; use with <c>ESCAPE '\'</c>.</summary>
    public static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    /// <summary>Builds <c>:prefix0, :prefix1…</c> placeholders and their values for an IN list.</summary>
    public static (string Placeholders, DynamicParameters Parameters) InList(string prefix, IReadOnlyList<string> values, DynamicParameters? parameters = null)
    {
        parameters ??= new DynamicParameters();
        for (var i = 0; i < values.Count; i++)
        {
            parameters.Add(prefix + i, values[i], DbType.AnsiString);
        }
        return (string.Join(", ", values.Select((_, i) => ":" + prefix + i)), parameters);
    }
}

/// <summary>ODP.NET binds by position unless BindByName is set; Dapper uses named parameters.</summary>
internal sealed class OracleParameters : SqlMapper.IDynamicParameters
{
    private readonly SqlMapper.IDynamicParameters inner;
    public OracleParameters(object values) => inner = values as DynamicParameters ?? new DynamicParameters(values);
    public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
    {
        if (command is OracleCommand oracle)
        {
            oracle.BindByName = true;
        }
        inner.AddParameters(command, identity);
    }
}
