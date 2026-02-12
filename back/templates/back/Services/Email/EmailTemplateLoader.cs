using System.IO;
using System.Threading.Tasks;

public static class EmailTemplateLoader
{
    /// <summary>
    /// Charge un fichier HTML depuis le dossier wwwroot/EmailTemplates.
    /// </summary>
    public static async Task<string> LoadTemplateAsync(string fileName)
    {
        // chemin du fichier a partir du dossier courant
        string path = Path.Combine("Email", "EmailTemplates", fileName);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Le fichier {fileName} est introuvable.", path);
        }
        return await File.ReadAllTextAsync(path);
    }

    /// <summary>
    /// Remplace les variables dynamiques dans le template.
    /// </summary>
    public static string ReplacePlaceholders(string template, Dictionary<string, string> placeholders)
    {
        foreach (var placeholder in placeholders)
        {
            template = template.Replace("{{" + placeholder.Key + "}}", placeholder.Value);
        }
        return template;
    }

    /// <summary>
    /// Genere un email en combinant un template avec des valeurs dynamiques.
    /// </summary>
    /// <param name="templateName">Le nom du fichier template HTML</param>
    /// <param name="placeholders">Dictionnaire contenant les cles et leurs valeurs</param>
    /// <returns>Email formate avec les variables remplacees</returns>
    public static async Task<string> GenerateEmailAsync(string templateName, Dictionary<string, string> placeholders)
    {
        string template = await LoadTemplateAsync(templateName);

        // Remplacement des variables dynamiques
        return ReplacePlaceholders(template, placeholders);
    }
}
