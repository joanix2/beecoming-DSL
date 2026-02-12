using opteeam_api.Models;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace opteeam_api.DTOs;
public class CustomFormBaseOutput
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Color { get; set; }
    public required string Icon { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public required Guid? MissionTypeId { get; set; }
    public string? MissionTypeName { get; set; }
    public string? ExportFileName { get; set; }
    public string? ExportFileUrl { get; set; }

    [SetsRequiredMembers]
    public CustomFormBaseOutput(CustomForm model, FileInfoResponse? exportFile)
    {
        Id = model.Id;
        Name = model.Name;
        Color = model.Color;
        Icon = model.Icon;
        ArchivedAt = model.ArchivedAt;
        MissionTypeId = model.MissionTypeId;
        MissionTypeName = model.MissionType?.Name;
        ExportFileName = exportFile?.Name;
        ExportFileUrl = exportFile?.Url;
    }
}
public class CustomFormOutput : CustomFormBaseOutput
{
    public FormStructure FormStructure { get; set; }
    [SetsRequiredMembers]
    public CustomFormOutput(CustomForm model, FileInfoResponse? exportFile) : base(model, exportFile)
    {
        FormStructure = model.Structure;
    }
}
public class CustomFormWithBaseAnswerOutput : CustomFormOutput
{
    public CustomFormData CustomFormData { get; set; } = new();
    public FormStructureOutput FormStructure { get; set; }
    public string? Disclaimer { get; set; }
    [SetsRequiredMembers]
    public CustomFormWithBaseAnswerOutput(CustomForm model, FileInfoResponse? exportFile) : base(model, exportFile)
    {
        CustomFormData = model.Structure.GenerateDefaultCustomFormData();
        FormStructure = new FormStructureOutput(model.Structure);
    }
}
public class CustomFormWithSavedDataOutput : CustomFormBaseOutput
{
    public CustomFormData SavedData { get; set; }
    public FormStructureOutput FormStructure { get; set; }
    
    [SetsRequiredMembers]
    public CustomFormWithSavedDataOutput(CustomForm customForm, CustomFormResponse response, FileInfoResponse? exportFile) 
        : base(customForm, exportFile)
    {
        SavedData = response.Data;
        FormStructure = new FormStructureOutput(customForm.Structure);
    }
}
public class FormStructureOutput
{
    public required List<SectionOutput> Sections { get; set; } = new();
    [SetsRequiredMembers]
    public FormStructureOutput(FormStructure model)
    {
        Sections = model.Sections.Select(s => new SectionOutput(s)).ToList();
    }
}
public class SectionOutput
{
    public required string Id { get; set; }
    public required List<FieldOutput> Fields { get; set; } = new();

    [SetsRequiredMembers]
    public SectionOutput(Section model)
    {
        Id = model.Id;
        Fields = model.Fields.Select(f => new FieldOutput(f)).ToList();
    }
}
public class FieldOutput
{
    public required string Id { get; set; }
    public required string Label { get; set; }
    public required FieldType Type { get; set; }
    public string? Description { get; set; }
    public required bool IsRequired { get; set; } = false;
    public required bool IsReadonly { get; set; } = false;
    public List<OptionOutput> Options { get; set; } = new();

    public required bool IsDeleted { get; set; } = false;
    public required int Order { get; set; }
    [SetsRequiredMembers]
    public FieldOutput(Field model)
    {
        Id = model.Id;
        Label = model.Label;
        Type = model.Type;
        Description = model.Description;
        IsRequired = model.IsRequired;
        IsReadonly = model.IsReadOnly;
        IsDeleted = model.IsDeleted;
        Order = model.Order;
        Options = model.Options != null ? model.Options.Select(o => new OptionOutput(o)).ToList() : new();
    }
}
public class OptionOutput
{
    public required string Id { get; set; }
    public required string Label { get; set; }
    public required bool IsDeleted { get; set; } = false;
    public required int Order { get; set; }
    [SetsRequiredMembers]
    public OptionOutput(Option model)
    {
        Id = model.Id;
        Label = model.Label;
        Order = model.Order;
        IsDeleted = model.IsDeleted;
    }
}
public class CustomFormListOutput
{
    [Required]
    public required Guid Id { get; set; }
    [Required]
    public required string Name { get; set; }
    public string? ExportFileName { get; set; }
    
    [SetsRequiredMembers]
    public CustomFormListOutput(CustomForm model, FileInfoResponse? exportFile)
    {
        Id = model.Id;
        Name = model.Name;
        ExportFileName = exportFile?.Name;
    }

    public CustomFormListOutput() { }
}

public class CustomFormInput
{
    [Required]
    public required string Name { get; set; }
    [Required]
    public required string Color { get; set; }
    [Required]
    public required string Icon { get; set; }
    public Guid? MissionTypeId { get; set; }
    public FormStructureInput Structure { get; set; }
}
public class FormStructureInput
{
    public List<SectionInput> Sections { get; set; } = new();
}
public class SectionInput
{
    public string? Id { get; set; }
    public required string Name { get; set; }
    public List<FieldInput> Fields { get; set; } = new();
}
public class FieldInput
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    public required string Label { get; set; }
    public required FieldType Type { get; set; }
    public required bool IsRequired { get; set; } = false;
    public required bool IsReadOnly { get; set; } = false;
    public required bool IsDeleted { get; set; } = false;
    public required int Order { get; set; }
    public List<OptionInput>? Options { get; set; } = new();
}
public class OptionInput
{
    public string? Id { get; set; }
    public required string Label { get; set; }
    public required bool IsDeleted { get; set; } = false;
    public required int Order { get; set; }
}
public class CustomFormResponseInput
{
    [Required]
    public required Guid CustomFormId { get; set; }
    [Required] 
    public required CustomFormData Data { get; set; }
}