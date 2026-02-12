using api.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.WebUtilities;

namespace api.Models;

public class ODATAResponse<T>
{
    public ODATAResponse(IQueryable<T> values, ODataQueryOptions<T> options, ControllerBase controller, string method)
    {
        var currentURL = GetControllerURL(controller, method);

        values = options.ApplyAndGetCount(values, out var _count);
        Count = _count;

        var top = options.Top?.Value ?? 100;
        var skip = options.Skip?.Value ?? 0;

        var parameters = new List<KeyValuePair<string, string>>
        {
            new("top", $"{top}")
        };

        AddParameterIfNotEmpty(parameters, "filter", options.Filter?.RawValue);
        AddParameterIfNotEmpty(parameters, "select", options.SelectExpand?.RawSelect);
        AddParameterIfNotEmpty(parameters, "orderby", options.OrderBy?.RawValue);

        PageNumber = skip / top + 1;
        PageSize = top;

        if (skip + top < Count)
            NextLink = QueryHelpers.AddQueryString(currentURL, new Dictionary<string, string>
            {
                { "skip", $"{skip + PageSize}" },
                { "top", $"{top}" }
            });

        if (skip > 0)
            PreviousLink = QueryHelpers.AddQueryString(currentURL, new Dictionary<string, string>
            {
                { "skip", $"{skip - PageSize}" },
                { "top", $"{top}" }
            });

        Value = values;
    }

    public int Count { get; set; }
    public int PageSize { get; set; }
    public int PageNumber { get; set; }
    public string NextLink { get; set; }
    public string PreviousLink { get; set; }
    public IEnumerable<T> Value { get; set; }

    private static void AddParameterIfNotEmpty(List<KeyValuePair<string, string>> parameters, string key, string value)
    {
        if (!string.IsNullOrEmpty(value)) parameters.Add(new KeyValuePair<string, string>(key, value));
    }

    private static string GetControllerURL(ControllerBase controller, string method)
    {
        return controller.Url.Action(method, controller.GetType().Name.Replace("Controller", ""), new { },
            controller.Request.Scheme);
    }
}

public class ListResponse<T>
{
    public ListResponse(IEnumerable<T> values, int count)
    {
        Value = values;
        Count = count;
    }

    public int Count { get; set; }
    public IEnumerable<T> Value { get; set; }
}