using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
namespace APH.SiteHub.Application;

public static partial class Normalize
{
    public static Result<string> Required(string? value, string label, int max = 4096) =>
        string.IsNullOrWhiteSpace(value) || value.Trim().Length > max
            ? Result<string>.Failure(Error.Invalid($"Invalid {label}")) : Result<string>.Success(value.Trim());
    public static Result<string> Password(string? value, int min = 1) =>
        string.IsNullOrWhiteSpace(value) || value.Length < min || value.Length > 256
            ? Result<string>.Failure(Error.Invalid($"Password must be between {min} and 256 characters")) : Result<string>.Success(value);
    public static Result<string> Url(string? value)
    {
        var text = Required(value, "URL", 2048);
        if (text.IsFailure)
        {
            return text;
        }
        if (!Uri.TryCreate(text.Value, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "http" && uri.Scheme != "https") || string.IsNullOrEmpty(uri.Host) || !string.IsNullOrEmpty(uri.UserInfo))
        {
            return Result<string>.Failure(Error.Invalid("URL must use HTTP or HTTPS and must not contain credentials"));
        }
        return uri.AbsoluteUri.Length > 2048 ? Result<string>.Failure(Error.Invalid("URL is too long")) : Result<string>.Success(uri.AbsoluteUri);
    }
    public static string Fold(string text) => string.Concat(text.ToLowerInvariant().Normalize(NormalizationForm.FormD)
        .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)).Replace('đ', 'd');
    public static Result<string[]> TagIds(string[]? ids)
    {
        ids ??= [];
        return ids.Length > 50 || ids.Distinct().Count() != ids.Length || ids.Any(id => !Guid.TryParseExact(id, "D", out var g) || g.Version != 4)
            ? Result<string[]>.Failure(Error.Invalid("Invalid tag IDs")) : Result<string[]>.Success(ids);
    }
    public static string Timestamp() => DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
    public static Result<string> Color(string? color) => color is null || !ColorPattern().IsMatch(color)
        ? Result<string>.Failure(Error.Invalid("Color must be a six-digit hex value")) : Result<string>.Success(color.ToLowerInvariant());
    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex ColorPattern();
}
