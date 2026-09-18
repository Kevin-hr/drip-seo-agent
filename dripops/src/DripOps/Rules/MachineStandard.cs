using System.Text.Json;
using DripOps.Configuration;

namespace DripOps.Rules;

public sealed record MachineStandard
{
    public required string Version { get; init; }
    public string SiteName { get; init; } = "Drip Sneakers";
    public string TitleIntentTerm { get; init; } = "Reps";
    public string SeoTitleTemplate { get; init; } = "{name} {sku} {intent} | {site}";
    public int MetaMinLength { get; init; } = 120;
    public int MetaMaxLength { get; init; } = 160;
    public int KeywordsMin { get; init; } = 6;
    public int KeywordsMax { get; init; } = 8;
    public int RelatedProductsMin { get; init; }
    public int RelatedProductsMax { get; init; }
    public int DefaultInternalLinks { get; init; } = 1;
    public bool ProductNameIncludesSku { get; init; } = true;
    public string SlugPattern { get; init; } = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    public List<string> RequiredVerifiedFacts { get; init; } = [];
    public List<string> ForbiddenPlaceholders { get; init; } = [];
    public List<string> ForbiddenDomains { get; init; } = [];
    public List<string> RiskTerms { get; init; } = [];
    public List<string> OfficialEntityTermExceptions { get; init; } = [];

    public static MachineStandard Load(string path)
    {
        var value = JsonSerializer.Deserialize<MachineStandard>(File.ReadAllText(path), JsonOptions.Default);
        return value ?? throw new InvalidDataException($"Invalid machine standard: {path}");
    }
}
