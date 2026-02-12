namespace opteeam_api.Models
{
    public class GeoapifyResponse
    {
        public List<Feature> features { get; set; }
    }

    public class Feature
    {
        public Geometry geometry { get; set; }
    }

    public class Geometry
    {
        public List<double> coordinates { get; set; }
    }
    public class CoordinatesMinimal
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
