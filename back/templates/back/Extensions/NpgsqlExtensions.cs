using Microsoft.EntityFrameworkCore;

namespace opteeam_api.Extensions;

public static class NpgsqlExtensions
{
    public const int DEFAULT_LEVENSHTEIN_THRESHOLD = 3;
    
    public const double DEFAULT_SIMILARITY_THRESHOLD = 0.1;
    
    [DbFunction("levenshtein", IsBuiltIn = true)]
    public static int Levenshtein(string source, string target) => throw new NotSupportedException();
    
    [DbFunction("similarity", IsBuiltIn = true)]
    public static double Similarity(string source, string target) => throw new NotSupportedException();
}