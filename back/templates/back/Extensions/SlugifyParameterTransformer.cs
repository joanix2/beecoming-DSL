using System.Text.RegularExpressions;

public class SlugifyParameterTransformer : IOutboundParameterTransformer
{
    public string TransformOutbound(object value)
    {
        // Slugify value
        return value == null ? null : Regex.Replace(input: value.ToString(), pattern: "([a-z])([A-Z])", replacement: "$1-$2").ToLower();
    }
}