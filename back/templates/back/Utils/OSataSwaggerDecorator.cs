using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

public class ODataSwaggerDecoratorOptions : IOperationFilter
{
    private static readonly List<OpenApiParameter> s_Parameters = new()
    {
        CreateParameter("$top", "The max number of records.", "Number"),
        CreateParameter("$skip", "The number of records to skip.", "Number"),
        CreateParameter("$filter", "A function that must evaluate to true for a record to be returned.", "String"),
        CreateParameter("$orderby", "Determines what values are used to order a collection of records.", "String"),
        CreateParameter("$search", "A function that must evaluate to true for a record to be returned.", "String")
    };

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // FilterRequestBodyContent(operation);
        // AddFileContentResponse(operation, context);
        // FilterResponseContent(operation);
        ReplaceODataParameters(operation, context);
        // AddEnableQueryParameters(operation, context);
    }

    private static OpenApiParameter CreateParameter(string name, string description, string type)
    {
        return new OpenApiParameter
        {
            Name = name,
            Required = false,
            Schema = new OpenApiSchema { Type = type },
            In = ParameterLocation.Query,
            Description = description
        };
    }

    private static void FilterRequestBodyContent(OpenApiOperation operation)
    {
        if (operation.RequestBody?.Content != null)
            operation.RequestBody.Content = operation.RequestBody.Content
                .Where(x => !x.Key.Contains(";odata.") && !x.Key.Contains("application/xml") &&
                            !x.Key.Contains("text/plain") && !x.Key.Contains("IEEE754Compatible"))
                .ToDictionary(x => x.Key, x => x.Value);
    }

    private static void AddFileContentResponse(OpenApiOperation operation, OperationFilterContext context)
    {
        if (context.MethodInfo.ReturnType == typeof(FileContentResult))
            foreach (var response in operation.Responses.Where(x => x.Key == "200"))
                response.Value.Content.Add("application/octet-stream", new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Format = "binary",
                        Type = "string"
                    }
                });
    }

    private static void FilterResponseContent(OpenApiOperation operation)
    {
        if (operation.Responses != null)
            foreach (var response in operation.Responses)
                response.Value.Content = response.Value.Content
                    .Where(x => !x.Key.Contains(";odata.") && !x.Key.Contains("application/xml") &&
                                !x.Key.Contains("IEEE754Compatible"))
                    .ToDictionary(x => x.Key, x => x.Value);
    }

    private static void ReplaceODataParameters(OpenApiOperation operation, OperationFilterContext context)
    {
        var odataParams = context.ApiDescription.ParameterDescriptions
            .Where(desc => desc?.ParameterDescriptor?.ParameterType?.BaseType == typeof(ODataQueryOptions))
            .Select(desc => operation.Parameters.SingleOrDefault(p => p.Name == desc.Name))
            .Where(toRemove => toRemove != null)
            .ToList();

        foreach (var param in odataParams) operation.Parameters.Remove(param);

        if (odataParams.Count > 0)
        {
            foreach (var item in s_Parameters)
                if (!operation.Parameters.Any(x => x.Name == item.Name))
                    operation.Parameters.Add(item);
        }
    }

    private static void AddEnableQueryParameters(OpenApiOperation operation, OperationFilterContext context)
    {
        if (context.ApiDescription.ActionDescriptor.EndpointMetadata.Any(em => em is EnableQueryAttribute))
        {
            operation.Parameters ??= new List<OpenApiParameter>();
            foreach (var item in s_Parameters)
                if (!operation.Parameters.Any(x => x.Name == item.Name))
                    operation.Parameters.Add(item);
        }
    }
}