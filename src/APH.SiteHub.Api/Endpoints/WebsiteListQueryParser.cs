using System.Globalization;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Websites;
namespace APH.SiteHub.Api.Endpoints;

public static class WebsiteListQueryParser
{
    public static Result<ListWebsitesQuery> Parse(IQueryCollection query)
    {
        if (query.Keys.Any(key => key is not ("page" or "pageSize" or "search" or "tagIds")) || query.Any(pair => pair.Value.Count != 1))
        {
            return Result<ListWebsitesQuery>.Failure(Error.Invalid("Invalid query parameter"));
        }
        Result<int> Integer(string key, int fallback)
        {
            if (!query.TryGetValue(key, out var value))
            {
                return Result<int>.Success(fallback);
            }
            return !int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var n) || value.ToString().StartsWith('0')
                ? Result<int>.Failure(Error.Invalid($"Invalid {key}")) : Result<int>.Success(n);
        }
        var page = Integer("page", 1);
        var size = Integer("pageSize", 12);
        if (ResultValidation.FirstFailure(page, size) is { } error)
        {
            return Result<ListWebsitesQuery>.Failure(error);
        }
        var ids = query["tagIds"].ToString();
        return Result<ListWebsitesQuery>.Success(new(page.Value, size.Value, query["search"].ToString(), ids.Length == 0 ? [] : ids.Split(',')));
    }
}
