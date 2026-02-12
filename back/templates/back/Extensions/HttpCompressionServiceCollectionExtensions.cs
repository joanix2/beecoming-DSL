using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

namespace opteeam_api.Extensions
{
    public static class HttpServiceCollectionExtensions
    {
        public static IServiceCollection AddResponseCompressionSetup(this IServiceCollection services)
        {
            services.AddResponseCompression(options =>
            {
                options.Providers.Add<GzipCompressionProvider>();
                options.EnableForHttps = true;
            });

            services.Configure<GzipCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Fastest;
            });

            return services;
        }
    }
}
