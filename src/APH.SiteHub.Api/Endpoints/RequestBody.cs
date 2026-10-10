using APH.SiteHub.Api.Contracts;
using System.Globalization;
using System.Text.Json;
using APH.SiteHub.Application;
namespace APH.SiteHub.Api.Endpoints;

// A successful parse guarantees field types/presence before typed accessors are used.
public sealed class RequestBody
{
    private readonly JsonElement json;
    private RequestBody(JsonElement json) => this.json = json;
    public static async Task<Result<RequestBody>> ReadAsync(HttpRequest request, CancellationToken ct, RequestField[] fields)
    {
        if (!request.HasJsonContentType())
        {
            return Result<RequestBody>.Failure(Error.Invalid("Expected application/json"));
        }
        JsonElement json;
        try
        {
            json = await JsonSerializer.DeserializeAsync<JsonElement>(request.Body, cancellationToken: ct);
        }
        catch (JsonException) { return Result<RequestBody>.Failure(Error.Invalid("Invalid request body")); }
        catch (BadHttpRequestException ex) when (ex.StatusCode == 400) { return Result<RequestBody>.Failure(Error.Invalid("Invalid request body")); }
        if (json.ValueKind != JsonValueKind.Object || json.EnumerateObject().Any(p => !fields.Any(field => field.Name == p.Name)) ||
            json.EnumerateObject().GroupBy(p => p.Name).Any(g => g.Count() > 1))
        {
            return Result<RequestBody>.Failure(Error.Invalid("Invalid or unknown input fields"));
        }
        foreach (var field in fields.Where(field => field.Required))
        {
            if (!json.TryGetProperty(field.Name, out _))
            {
                return Result<RequestBody>.Failure(Error.Invalid($"{field.Name} is required"));
            }
        }
        foreach (var property in json.EnumerateObject())
        {
            var value = property.Value;
            var field = fields.Single(field => field.Name == property.Name);
            var valid = field.AllowNull && value.ValueKind == JsonValueKind.Null || (field.Type switch
            {
                RequestFieldType.Boolean => value.ValueKind is JsonValueKind.True or JsonValueKind.False,
                RequestFieldType.StringArray => value.ValueKind == JsonValueKind.Array && value.EnumerateArray().All(item => item.ValueKind == JsonValueKind.String),
                RequestFieldType.DateTime => value.ValueKind == JsonValueKind.String && DateTimeOffset.TryParse(value.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out _),
                _ => value.ValueKind == JsonValueKind.String
            });
            if (!valid)
            {
                return Result<RequestBody>.Failure(Error.Invalid($"Invalid {property.Name}"));
            }
        }
        return Result<RequestBody>.Success(new(json));
    }
    public string? Text(string name) => !json.TryGetProperty(name, out var value) || value.ValueKind == JsonValueKind.Null ? null : value.GetString();
    public bool? Boolean(string name) => json.TryGetProperty(name, out var value) ? value.GetBoolean() : null;
    public string[]? Strings(string name) => json.TryGetProperty(name, out var value) ? value.EnumerateArray().Select(item => item.GetString()!).ToArray() : null;
    public DateTime? Date(string name) => Text(name) is { } text ? DateTimeOffset.Parse(text, CultureInfo.InvariantCulture, DateTimeStyles.None).UtcDateTime : null;
}
