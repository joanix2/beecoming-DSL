using Microsoft.AspNetCore.OData.Query;

namespace api.Utils;

public static class QueryHelper
{
    public static IQueryable<T> ApplyAndGetCount<T>(
        this ODataQueryOptions<T> options,
        IQueryable<T> queryable,
        out int count
    )
    {
        var baseQuery = queryable;
        try
        {
            queryable = options.ApplyTo(queryable, AllowedQueryOptions.Skip | AllowedQueryOptions.Top) as IQueryable<T>;
            count = queryable.Count();
        }
        catch (Exception e)
        {
            queryable = baseQuery.ToList().AsQueryable();
            queryable = options.ApplyTo(queryable, AllowedQueryOptions.Skip | AllowedQueryOptions.Top) as IQueryable<T>;
            count = queryable.Count();
        }

        if (options.Skip?.Value != null) queryable = queryable.Skip(options.Skip.Value);
        if (options.Top?.Value != null) queryable = queryable.Take(options.Top.Value);

        return queryable;
    }
}