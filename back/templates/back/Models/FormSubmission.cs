using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace opteeam_api.Models
{
    public class CustomFormResponse
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid CustomFormId { get; set; }
        [ForeignKey(nameof(CustomFormId))] public CustomForm CustomForm { get; set; }

        public Guid MissionId { get; set; }
        [ForeignKey(nameof(MissionId))] public Mission Mission { get; set; }

        [Column(TypeName = "jsonb")]
        public CustomFormData Data { get; set; } // Stocke toutes les réponses sous format JSON
    }

    public class CustomFormData
    {
        [JsonPropertyName("sections")]
        public List<SectionResponse> SectionResponses { get; set; }
    }

    public class SectionResponse
    {
        [JsonPropertyName("sectionId")]
        public string SectionId { get; set; }

        [JsonPropertyName("fields")]
        public List<FieldResponse> FieldResponses { get; set; }
    }

    public class FieldResponse
    {
        [JsonPropertyName("fieldId")]
        public string FieldId { get; set; }

        [JsonPropertyName("value")]
        public object Value { get; set; } // Permet de stocker tout type de valeur
    }

}
