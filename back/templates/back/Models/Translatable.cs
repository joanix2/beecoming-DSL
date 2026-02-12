using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace opteeam_api.Models;
using System.Collections.Generic;

public class Translatable
{
    private readonly Dictionary<string, string> _translations = new();

    public Translatable(Dictionary<string, string> translations)
    {
        _translations = translations;
    }

    public void AddTranslation(string language, string text)
    {
        _translations[language] = text;
    }

    public void Add(string language, string text)
    {
        AddTranslation(language, text);
    }

    public string this[string language]
    {
        get => GetTranslation(language);
        set => AddTranslation(language, value);
    }

    public string GetTranslation(string language)
    {
        return _translations.TryGetValue(language, out var text) ? text : null;
    }

    public Dictionary<string, string> GetAllTranslations() => new(_translations);
}
public class TranslatableConverter : ValueConverter<Translatable, string>
{
    public TranslatableConverter() 
        : base(
            v => JsonSerializer.Serialize(v.GetAllTranslations(), (JsonSerializerOptions)null),
            v => CreateTranslatableFromJson(v))
    {
    }

    private static Translatable CreateTranslatableFromJson(string json)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
        var translatable = new Translatable(dict);
        return translatable;
    }
}
public class TranslatableJsonConverter : JsonConverter<Translatable>
{
    public override Translatable Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(ref reader, options);
        return new Translatable(dict);
    }

    public override void Write(Utf8JsonWriter writer, Translatable value, JsonSerializerOptions options)
    {
        var dict = value.GetAllTranslations();
        JsonSerializer.Serialize(writer, dict, options);
    }
}
