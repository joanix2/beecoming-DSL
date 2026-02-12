namespace data_lib.Utility;

public static class CorsHelper
{
    /**
     * This method is used to allow CORS for local development.
     */
    public static bool IsOriginAllowed(string origin)
    {
        // Your logic.
        var localNetworkIps = Enumerable.Range(2, 254).ToArray();
        var localNetworkIpsString = localNetworkIps.Select(ip => $"http://10.0.0.{ip}:4200").ToList();
    
        List<string> localUrls = new()
        {
            "http://localhost:4200",

        };
    
        localNetworkIpsString.AddRange(localUrls);

        return localNetworkIpsString.Contains(origin);
    }
}