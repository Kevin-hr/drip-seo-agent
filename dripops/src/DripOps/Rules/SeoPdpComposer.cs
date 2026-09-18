using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using DripOps.Configuration;
using DripOps.Domain;

namespace DripOps.Rules;

public sealed class SeoPdpComposer
{
    private readonly MachineStandard _standard;
    private readonly DripOpsConfig _config;

    public SeoPdpComposer(MachineStandard standard, DripOpsConfig config)
    {
        _standard = standard;
        _config = config;
    }

    public SeoDraft Compose(ProductFacts facts, IReadOnlyList<RelatedProduct>? relatedProducts = null,
        string? currentUrl = null, bool urlChangeRequired = false, string? redirectFrom = null)
    {
        EnsureCoreFacts(facts);

        var productName = facts.DisplayProductName;
        var keywords = BuildKeywords(facts, productName);
        var recommendedSlug = Slugify($"{facts.Brand} {facts.ModelName} {facts.PrimaryColorway} {facts.Sku}");
        var normalizedCurrentUrl = string.IsNullOrWhiteSpace(currentUrl) ? null : currentUrl.Trim().Trim('/');
        // V3.2 URL Stability: keep an existing slug unless migration is explicitly requested.
        var slug = normalizedCurrentUrl is not null && !urlChangeRequired ? normalizedCurrentUrl : recommendedSlug;
        var canonical = $"{_config.StoreOrigin.TrimEnd('/')}/{slug}";
        var migrationRequired = urlChangeRequired && normalizedCurrentUrl is not null &&
                                !string.Equals(normalizedCurrentUrl, slug, StringComparison.OrdinalIgnoreCase);
        var effectiveRedirectFrom = migrationRequired
            ? (string.IsNullOrWhiteSpace(redirectFrom) ? $"/{normalizedCurrentUrl}" : redirectFrom)
            : null;
        var related = (relatedProducts ?? []).Take(_standard.RelatedProductsMax).ToList();

        return new SeoDraft
        {
            ProductName = productName,
            // Business override retained for 3.2: {Name} means the base name without SKU.
            // The rendered title therefore contains the verified SKU exactly once.
            SeoTitle = $"{facts.BaseProductName} {facts.Sku} {_standard.TitleIntentTerm} | {_standard.SiteName}",
            Keywords = keywords,
            MetaDescription = BuildMetaDescription(facts, productName),
            Slug = slug,
            CurrentUrl = normalizedCurrentUrl,
            CanonicalUrl = canonical,
            UrlChangeRequired = migrationRequired,
            RedirectFrom = effectiveRedirectFrom,
            PdpHtml = BuildPdpHtml(facts, productName),
            RelatedProducts = related
        };
    }

    private static void EnsureCoreFacts(ProductFacts facts)
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(facts.Brand)) missing.Add("brand");
        if (string.IsNullOrWhiteSpace(facts.ModelName)) missing.Add("modelName");
        if (string.IsNullOrWhiteSpace(facts.PrimaryColorway)) missing.Add("primaryColorway");
        if (string.IsNullOrWhiteSpace(facts.Sku)) missing.Add("sku");
        if (string.IsNullOrWhiteSpace(facts.ProductType)) missing.Add("productType");
        if (string.IsNullOrWhiteSpace(facts.CategoryPath)) missing.Add("categoryPath");
        if (string.IsNullOrWhiteSpace(facts.ProductIntro)) missing.Add("productIntro");
        if (!facts.SkuVerified) missing.Add("skuVerified");
        if (!facts.ImageMatchVerified) missing.Add("imageMatchVerified");
        if (missing.Count > 0)
        {
            throw new InvalidOperationException($"Cannot compose publishable content; missing verified facts: {string.Join(", ", missing)}");
        }
    }

    private List<string> BuildKeywords(ProductFacts facts, string productName)
    {
        var candidates = new[]
        {
            productName,
            $"{facts.Brand} {facts.ModelName} Reps",
            $"{facts.ModelName} {facts.PrimaryColorway} Reps",
            facts.Sku,
            $"{facts.Brand} {facts.ModelName}",
            $"{facts.ModelName} {facts.PrimaryColorway}",
            CategoryIntent(facts.ProductType),
            $"{facts.Brand} {facts.ProductType}"
        };

        return candidates
            .Select(value => Regex.Replace(value.Trim(), @"\s+", " "))
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(_standard.KeywordsMax)
            .ToList();
    }

    private static string CategoryIntent(string productType)
    {
        var value = productType.Trim().ToLowerInvariant();
        if (value.Contains("hoodie")) return "Streetwear Hoodies";
        if (value.Contains("jean")) return "Designer Jeans";
        if (value.Contains("short")) return "Streetwear Shorts";
        if (value.Contains("shirt")) return "Designer T-Shirts";
        if (value.Contains("sneaker") || value.Contains("shoe")) return "Designer Sneakers";
        return $"Designer {productType}";
    }

    private string BuildMetaDescription(ProductFacts facts, string productName)
    {
        var prefix = $"Shop {productName} reps from {_standard.SiteName}";
        var verifiedClaims = new List<string>();
        if (_config.TrustClaims.QcPhotosVerified) verifiedClaims.Add("real QC photos");
        if (_config.TrustClaims.ThirtyDayReturnsVerified) verifiedClaims.Add("30-day returns");
        if (_config.TrustClaims.DeliveryWindowVerified) verifiedClaims.Add(_config.TrustClaims.DeliveryWindow);

        var candidates = new List<string>();
        if (verifiedClaims.Count > 0)
        {
            candidates.Add($"{prefix} with {JoinNatural(verifiedClaims)}.");
        }
        candidates.Add($"{prefix}. Review verified colorway details and current product images before ordering.");
        candidates.Add($"{prefix}. View verified product details, colorway information and current images before ordering.");
        candidates.Add($"{prefix}. View verified product details, colorway and current images before ordering.");
        candidates.Add($"{prefix}. View verified product details and current images before ordering.");
        candidates.Add($"{prefix}. View verified details and current product images before ordering.");
        candidates.Add($"{prefix}. View the verified colorway, product details and current images.");
        candidates.Add($"{prefix}. See current images.");

        var selected = candidates
            .Where(value => value.Length <= _standard.MetaMaxLength)
            .OrderByDescending(value => value.Length >= _standard.MetaMinLength)
            .ThenByDescending(value => value.Length)
            .FirstOrDefault();

        return selected ?? $"{prefix}.";
    }

    private static string JoinNatural(IReadOnlyList<string> values)
    {
        if (values.Count == 1) return values[0];
        if (values.Count == 2) return $"{values[0]} and {values[1]}";
        return $"{string.Join(", ", values.Take(values.Count - 1))} and {values[^1]}";
    }

    private string BuildPdpHtml(ProductFacts facts, string productName)
    {
        static string E(string value) => WebUtility.HtmlEncode(value);
        static string Attribute(string value) => WebUtility.HtmlEncode(value);

        var html = new StringBuilder();
        html.Append("<section class=\"ds-pdp-description\" data-version=\"")
            .Append(Attribute(_standard.Version)).Append("\">");
        html.Append("<h2>").Append(E(productName)).Append("</h2>");
        html.Append("<p>").Append(E(facts.ProductIntro.Trim())).Append("</p>");
        html.Append("<h3>Product Details</h3><ul>");
        html.Append("<li><strong>Style:</strong> <a href=\"")
            .Append(Attribute(NormalizeRelativePath(facts.CategoryPath))).Append("\">")
            .Append(E(string.IsNullOrWhiteSpace(facts.Style) ? $"{facts.Brand} {facts.ModelName}" : facts.Style.Trim()))
            .Append("</a></li>");
        AddOptional(html, "Colorway", facts.PrimaryColorway);
        AddOptional(html, "Silhouette", facts.Silhouette);
        if (IsSneaker(facts.ProductType))
        {
            AddOptional(html, "Upper Design", facts.UpperDesign);
            AddOptional(html, "Signature Details", facts.SignatureDetails);
            AddOptional(html, "Midsole", facts.Midsole);
        }
        else
        {
            AddOptional(html, "Material", facts.Material);
            AddOptional(html, "Design Details", facts.DesignDetails);
        }
        AddOptional(html, "Reference Style Code", facts.Sku);
        html.Append("</ul>");

        html.Append("</section>");
        return html.ToString();
    }

    private static bool IsSneaker(string productType)
    {
        var value = productType.Trim().ToLowerInvariant();
        return value.Contains("sneaker") || value.Contains("shoe");
    }

    private static void AddOptional(StringBuilder html, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            html.Append("<li><strong>").Append(WebUtility.HtmlEncode(label)).Append(":</strong> ")
                .Append(WebUtility.HtmlEncode(value.Trim())).Append("</li>");
        }
    }

    private static string NormalizeRelativePath(string value)
    {
        var trimmed = value.Trim();
        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute)) return absolute.PathAndQuery;
        if (!trimmed.StartsWith('/')) trimmed = "/" + trimmed;
        return trimmed;
    }

    public static string Slugify(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var withoutMarks = new string(normalized.Where(c =>
            System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) !=
            System.Globalization.UnicodeCategory.NonSpacingMark).ToArray());
        return Regex.Replace(withoutMarks.ToLowerInvariant().Replace("&", " and ", StringComparison.Ordinal), @"[^a-z0-9]+", "-")
            .Trim('-');
    }
}
