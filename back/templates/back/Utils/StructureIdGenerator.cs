using opteeam_api.DTOs;
using opteeam_api.Models;

namespace opteeam_api.Utils;
/// <summary>
/// Classe statique permettant la génération d'id dans une structure en jsonb
/// </summary>
public static class StructureIdGenerator
{
    /// <summary>
    /// Génère un ID unique pour chaque élement du formulaire (section, champ, option)
    /// </summary>
    /// <param name="structure"></param>
    public static void Generate(FormStructureInput structure)
    {
        foreach (var section in structure.Sections)
        {
            GenerateSectionId(section);
            GenerateFieldAndOptionIds(section);
        }
    }
    
    private static void GenerateSectionId(SectionInput section)
    {
        if (string.IsNullOrWhiteSpace(section.Id))
        {
            section.Id = Guid.NewGuid().ToString();
        }
    }

    public static string GenerateDisplayId(Guid id, string prefix)
    {
        var date = DateTime.Now.Date.ToString("yyyy_MM_dd");
        return prefix + "_" + date + "_" + id.ToString("N")[^8..];
    }

    private static void GenerateFieldAndOptionIds(SectionInput section)
    {
        foreach (var field in section.Fields)
        {
            GenerateFieldId(field);
            GenerateOptionIds(field);
        }
    }
    
    private static void GenerateFieldId(FieldInput field)
    {
        if (string.IsNullOrWhiteSpace(field.Id))
        {
            field.Id = Guid.NewGuid().ToString();
        }
    }
    

    private static void GenerateOptionIds(FieldInput field)
    {
        foreach (var option in field.Options?.Where(o => string.IsNullOrWhiteSpace(o.Id)) ?? [])
        {
            option.Id = Guid.NewGuid().ToString();
        }
    }
}