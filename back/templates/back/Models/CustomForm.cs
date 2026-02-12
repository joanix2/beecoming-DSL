using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using opteeam_api.DTOs;
using opteeam_api.Utils;

namespace opteeam_api.Models
{
    public enum FieldType
    {
        Text,
        Paragraph,
        Number,
        NumberInt,
        Date,
        DateRange,
        Datetime,
        Time,
        Radio,
        Checkbox,
        Select,
        Signature,
        Photo,
        PhotoMultiple,
    }

    public class FieldTypeDefinition
    {
        public required string Color { get; set; }
        public required string Icon { get; set; }
 
        public static Dictionary<string, FieldTypeDefinition> All =>
            new()
            {
                {
                    nameof(FieldType.Text),
                    new FieldTypeDefinition { Color = "#A16826", Icon = "text" }
                },
                {
                    nameof(FieldType.Paragraph),
                    new FieldTypeDefinition { Color = "#A16826", Icon = "contexte" }
                },
                {
                    nameof(FieldType.Number),
                    new FieldTypeDefinition { Color = "#2670A1", Icon = "numerique" }
                },
                {
                    nameof(FieldType.NumberInt),
                    new FieldTypeDefinition { Color = "#2670A1", Icon = "chiffre" }
                },
                {
                    nameof(FieldType.Date),
                    new FieldTypeDefinition { Color = "#26A168", Icon = "date" }
                },
                {
                    nameof(FieldType.DateRange),
                    new FieldTypeDefinition { Color = "#26A168", Icon = "date" }
                },
                {
                    nameof(FieldType.Datetime),
                    new FieldTypeDefinition { Color = "#26A168", Icon = "date_heure" }
                },
                {
                    nameof(FieldType.Time),
                    new FieldTypeDefinition { Color = "#26A168", Icon = "heure" }
                },
                {
                    nameof(FieldType.Radio),
                    new FieldTypeDefinition { Color = "#FF8800", Icon = "radiobtn" }
                },
                {
                    nameof(FieldType.Checkbox),
                    new FieldTypeDefinition { Color = "#FF8800", Icon = "checkbox" }
                },
                {
                    nameof(FieldType.Select),
                    new FieldTypeDefinition { Color = "#32EBD1", Icon = "deroulante" }
                },
                {
                    nameof(FieldType.Signature),
                    new FieldTypeDefinition { Color = "#D29E48", Icon = "signature" }
                },
                {
                    nameof(FieldType.Photo),
                    new FieldTypeDefinition { Color = "#0C4B75", Icon = "photo" }
                },
                {
                    nameof(FieldType.PhotoMultiple),
                    new FieldTypeDefinition { Color = "#0C4B75", Icon = "photo" }
                },
            };
    }

    public class CustomForm : BaseType, IArchivable
    {
        public DateTimeOffset? ArchivedAt { get; set; }
        public required FormStructure Structure { get; set; }
        public ICollection<CustomFormResponse> CustomFormResponses { get; set; }
        public Guid? MissionTypeId { get; set; }
        [ForeignKey(nameof(MissionTypeId))]
        public MissionType? MissionType { get; set; }

        public CustomForm() { }

        [SetsRequiredMembers]
        public CustomForm(CustomFormInput customFormInput)
        {
            Name = customFormInput.Name;
            Color = customFormInput.Color;
            Icon = customFormInput.Icon;
            MissionTypeId = customFormInput.MissionTypeId;
            Structure = new FormStructure(new FormStructureInput {
                Sections = customFormInput.Structure.Sections.Select(s => new SectionInput {
                    Id = s.Id,
                    Name = s.Name,
                    Fields = s.Fields.Select(f => new FieldInput {
                        Id = f.Id,
                        Label = f.Label,
                        Type = f.Type,
                        IsRequired = f.IsRequired,
                        IsReadOnly = f.IsReadOnly,
                        IsDeleted = f.IsDeleted,
                        Order = f.Order,
                        Options = f.Options?.Select(o => new OptionInput {
                            Id = o.Id,
                            Label = o.Label,
                            IsDeleted = o.IsDeleted,
                            Order = o.Order,
                        }).ToList(),
                    }).ToList(),
                }).ToList(),
            });
        }
    }

    public class FormStructure
    {
        [JsonPropertyName("sections")]
        public required List<Section> Sections { get; set; }

        [SetsRequiredMembers]
        public FormStructure(FormStructureInput model)
        {
            Sections = model.Sections.Select(s => new Section(s)).ToList();
        }

        public FormStructure() { }

        public static FormStructure GenerateDefaultFormStructure()
        {
            return new FormStructure()
            {
                Sections = new List<Section>()
                {
                    new Section()
                    {
                        Id = HardCode.CUSTOM_FORM_INFOS_SECTION_ID.ToString(),
                        Name = "Informations générales",
                        Fields = new List<Field>(),
                    },
                    new Section()
                    {
                        Id = HardCode.CUSTOM_FORM_CONTEXT_SECTION_ID.ToString(),
                        Name = "Contexte",
                        Fields = new List<Field>(),
                    },
                    new Section()
                    {
                        Id = HardCode.CUSTOM_FORM_FILES_SECTION_ID.ToString(),
                        Name = "Photos et pièces jointes",
                        Fields = new List<Field>(),
                    },
                },
            };
        }

        public CustomFormData GenerateDefaultCustomFormData()
        {
            return new CustomFormData()
            {
                SectionResponses = Sections
                    .Select(section => new SectionResponse()
                    {
                        SectionId = section.Id,
                        FieldResponses = section
                            .Fields.Select(field => new FieldResponse()
                            {
                                FieldId = field.Id,
                                Value = "",
                            })
                            .ToList(),
                    })
                    .ToList(),
            };
        }
    }

    public class Section
    {
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("name")]
        public required string Name { get; set; }

        [JsonPropertyName("fields")]
        public required List<Field> Fields { get; set; }

        [SetsRequiredMembers]
        public Section(SectionInput model)
        {
            Id = model.Id ?? Guid.NewGuid().ToString();
            Name = model.Name;
            Fields = model.Fields.Select(f => new Field(f)).ToList();
        }

        public Section() { }
    }

    public class Field
    {
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("label")]
        public required string Label { get; set; }

        [JsonPropertyName("type")]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public required FieldType Type { get; set; }

        [JsonPropertyName("isRequired")]
        public required bool IsRequired { get; set; } = false;

        [JsonPropertyName("isReadOnly")]
        public required bool IsReadOnly { get; set; } = false;

        [JsonPropertyName("options")]
        public List<Option>? Options { get; set; }

        [JsonPropertyName("order")]
        public required int Order { get; set; }

        [JsonPropertyName("defaultValue")]
        public string? DefaultValue { get; set; }

        [JsonPropertyName("comment")]
        public string? Comment { get; set; }

        [JsonPropertyName("photo")]
        public string? Photo { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("isDeleted")]
        public required bool IsDeleted { get; set; } = false;

        [SetsRequiredMembers]
        public Field(FieldInput model)
        {
            Id = model.Id ?? Guid.NewGuid().ToString();
            Label = model.Label;
            Type = model.Type;
            IsRequired = model.IsRequired;
            IsReadOnly = model.IsReadOnly;
            IsDeleted = model.IsDeleted;
            Options =
                model.Options != null ? model.Options.Select(o => new Option(o)).ToList() : new();
            Order = model.Order;
        }

        public Field() { }
    }

    public class Option
    {
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("label")]
        public required string Label { get; set; }

        [JsonPropertyName("order")]
        public required int Order { get; set; }

        [JsonPropertyName("isDeleted")]
        public required bool IsDeleted { get; set; } = false;

        [SetsRequiredMembers]
        public Option(OptionInput model)
        {
            Id = model.Id ?? Guid.NewGuid().ToString();
            Label = model.Label;
            IsDeleted = model.IsDeleted;
            Order = model.Order;
        }

        public Option() { }
    }
}
