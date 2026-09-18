using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DripOps.Rules.V44;

/// <summary>
/// Machine-readable projection of
/// Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
///
/// This is the ONLY active SEO-PDP standard for the bridge. SEO/PDP 3.2 and the
/// superseded V4.4 STANDARD_FINAL are historical execution records and are
/// rejected outright, because 3.2 mandates a verified SKU while V4.4 permits
/// SKU_OMIT (V4.4 §5 and §5A).
/// </summary>
public sealed class V44Standard
{
    public string Version { get; init; } = "";
    public string Status { get; init; } = "";
    public string SiteName { get; init; } = "";
    public string StoreOrigin { get; init; } = "";
    public string TitleIntentTerm { get; init; } = "Reps";
    public string StandardDocument { get; init; } = "";
    public string StandardDocumentSha256 { get; init; } = "";

    public string SeoTitleTemplateWithSku { get; init; } = "";
    public string SeoTitleTemplateWithoutSku { get; init; } = "";
    public string MetaTemplateWithSku { get; init; } = "";
    public string MetaTemplateWithoutSku { get; init; } = "";

    public List<string> MetaApprovedAssurances { get; init; } = [];
    public List<string> MetaForbiddenPhrases { get; init; } = [];

    public int KeywordCount { get; init; } = 5;
    public string SlugPattern { get; init; } = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    public string CanonicalTemplate { get; init; } = "{origin}/{slug}";
    public int ProductDetailsFieldCount { get; init; } = 5;

    public List<string> ForbiddenIdentityTerms { get; init; } = [];
    public List<string> ForbiddenSupplierTerms { get; init; } = [];
    public List<string> ForbiddenDomains { get; init; } = [];
    public List<string> ForbiddenMetaPhrases { get; init; } = [];

    /// <summary>Lower-case hex SHA-256 of the canonical Markdown document bytes.</summary>
    public string DocumentHash { get; private set; } = "";

    /// <summary>File name of the canonical document, never an absolute path.</summary>
    public string DocumentFile { get; private set; } = "";

    private static readonly string[] ForbiddenDocumentPatterns =
    [
        @"SEO-PDP[-_ ]?3\.2",
        @"V4\.4_STANDARD_FINAL",
        @"V4\.4_STANDARD(?!_CLEAN_CONSOLIDATED)",
    ];

    public static V44Standard Load(string configPath, string documentPath)
    {
        if (!File.Exists(configPath)) throw new FileNotFoundException($"V4.4 rule config not found: {configPath}");
        if (!File.Exists(documentPath)) throw new FileNotFoundException($"V4.4 standard document not found: {documentPath}");

        var documentFile = Path.GetFileName(documentPath);
        foreach (var pattern in ForbiddenDocumentPatterns)
        {
            if (Regex.IsMatch(documentFile, pattern, RegexOptions.IgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Refusing to load '{documentFile}': it is a historical standard. " +
                    "Only Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md may be active.");
            }
        }

        var standard = JsonSerializer.Deserialize<V44Standard>(
            File.ReadAllText(configPath),
            DripOps.Configuration.JsonOptions.Default)
            ?? throw new InvalidDataException($"Invalid V4.4 rule config: {configPath}");

        var bytes = File.ReadAllBytes(documentPath);
        standard.DocumentHash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        standard.DocumentFile = documentFile;

        if (!string.Equals(standard.Version, "4.4", StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"V4.4 rule config declares version '{standard.Version}'; expected 4.4.");
        }

        if (!string.IsNullOrWhiteSpace(standard.StandardDocumentSha256)
            && !string.Equals(standard.StandardDocumentSha256, standard.DocumentHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Canonical standard hash mismatch. Config pins {standard.StandardDocumentSha256} " +
                $"but {documentFile} hashes to {standard.DocumentHash}. Refusing to start.");
        }

        var text = System.Text.Encoding.UTF8.GetString(bytes);
        if (!Regex.IsMatch(text, "^Version:\\s*`4\\.4`", RegexOptions.Multiline))
        {
            throw new InvalidOperationException("Canonical standard does not declare Version 4.4.");
        }

        return standard;
    }

    public string CanonicalUrl(string slug) =>
        CanonicalTemplate.Replace("{origin}", StoreOrigin.TrimEnd('/')).Replace("{slug}", slug);

    public string SeoTitle(string productName, string? sku) =>
        string.IsNullOrWhiteSpace(sku)
            ? Render(SeoTitleTemplateWithoutSku, productName, null)
            : Render(SeoTitleTemplateWithSku, productName, sku);

    public string MetaDescription(string productName, string? sku) =>
        string.IsNullOrWhiteSpace(sku)
            ? Render(MetaTemplateWithoutSku, productName, null)
            : Render(MetaTemplateWithSku, productName, sku);

    private string Render(string template, string productName, string? sku) =>
        template
            .Replace("{productName}", productName)
            .Replace("{sku}", sku ?? "")
            .Replace("{intent}", TitleIntentTerm)
            .Replace("{site}", SiteName)
            .Replace("  ", " ")
            .Trim();
}
