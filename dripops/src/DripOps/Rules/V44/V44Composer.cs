using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using DripOps.Domain;

namespace DripOps.Rules.V44;

/// <summary>
/// Deterministic V4.4 composer.
///
/// This is a NEW generator written against
/// Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md. It deliberately
/// shares no rules with SeoPdpComposer (SEO/PDP 3.2), because 3.2 mandates a
/// verified SKU while V4.4 §5/§5A permits publishing with the SKU omitted.
/// </summary>
public sealed class V44Composer(V44Standard standard)
{
    private static readonly Regex HarmfulSlugTokens = new(
        @"(pkgod|pk-god|luckdog|batch|top-quality|best-quality|1-1|aaa|replica|fake|fakequality)",
        RegexOptions.IgnoreCase);

    public V44Draft Compose(
        V44ExactEntity entity,
        V44Facts facts,
        string? verifiedSku,
        ProductSnapshot snapshot)
    {
        var productName = ComposeProductName(entity, facts);
        var sku = string.IsNullOrWhiteSpace(verifiedSku) ? null : verifiedSku.Trim();

        var slugDecision = DecideSlug(productName, sku, facts, snapshot);
        var canonical = standard.CanonicalUrl(slugDecision.Slug);

        var keywords = BuildKeywords(entity, productName, sku);

        var decisionSentence = facts.DecisionSentence?.Trim() ?? "";
        var fifth = ResolveFifthField(facts, sku);

        var keyDescription = BuildKeyDescription(facts, entity, decisionSentence, fifth);
        var imageAlts = BuildImageAlts(productName, snapshot.ImageUrls.Count);
        var descriptionHtml = BuildDescriptionHtml(snapshot.ImageUrls, imageAlts);

        return new V44Draft
        {
            ProductName = productName,
            H1 = productName,
            SeoTitle = standard.SeoTitle(productName, sku),
            Keywords = keywords,
            MetaDescription = standard.MetaDescription(productName, sku),
            Slug = slugDecision.Slug,
            CanonicalUrl = canonical,
            UrlChangeRequired = slugDecision.ChangeRequired,
            RedirectFrom = slugDecision.ChangeRequired
                ? (facts.RedirectFrom?.Trim() is { Length: > 0 } explicitFrom ? explicitFrom : slugDecision.CurrentUrl)
                : null,
            KeyDescriptionHtml = keyDescription,
            DescriptionHtml = descriptionHtml,
            ImageAlts = imageAlts,
            SchemaJson = BuildSchema(entity, productName, sku),
        };
    }

    // ------------------------------------------------------------------ naming

    /// <summary>V4.4 §6: Brand + Collaboration + Model + Product Type + Colorway.</summary>
    public string ComposeProductName(V44ExactEntity entity, V44Facts? facts = null)
    {
        var explicitName = facts?.ConsumerProductName?.Trim();
        if (!string.IsNullOrWhiteSpace(explicitName)) return Normalize(explicitName);

        var parts = new[]
        {
            entity.Brand,
            entity.CollaborationOrCollection ?? "",
            entity.Model,
            entity.ProductType,
            entity.Colorway
        };
        return Normalize(string.Join(' ', parts.Where(p => !string.IsNullOrWhiteSpace(p))));
    }

    // -------------------------------------------------------------------- slug

    private sealed record SlugDecision(string Slug, bool ChangeRequired, string? CurrentUrl);

    /// <summary>
    /// V4.4 §10. An existing correct live URL is stable by default; migration is
    /// required only for supplier noise, a wrong/unverified identifier,
    /// ambiguity, or broken slug residue.
    /// </summary>
    private SlugDecision DecideSlug(string productName, string? sku, V44Facts facts, ProductSnapshot snapshot)
    {
        var currentSlug = (snapshot.ExistingSlug ?? string.Empty).Trim().Trim('/');
        var currentUrl = string.IsNullOrWhiteSpace(currentSlug) ? null : standard.CanonicalUrl(currentSlug);
        var hasLiveUrl = snapshot.IsPublished && !string.IsNullOrWhiteSpace(currentSlug);

        if (facts.MigrateUrl)
        {
            var target = ResolveTargetSlug(productName, sku, facts);
            return new SlugDecision(target, true, currentUrl);
        }

        if (hasLiveUrl)
        {
            var harmful = HarmfulSlugTokens.IsMatch(currentSlug)
                || currentSlug.EndsWith('-')
                || currentSlug.StartsWith('-')
                || currentSlug.Contains("--", StringComparison.Ordinal)
                || !Regex.IsMatch(currentSlug, standard.SlugPattern);
            if (!harmful)
            {
                // Stability rule: keep the existing identifier-correct URL.
                return new SlugDecision(currentSlug, false, currentUrl);
            }
            var target = ResolveTargetSlug(productName, sku, facts);
            return new SlugDecision(target, !string.Equals(target, currentSlug, StringComparison.Ordinal), currentUrl);
        }

        return new SlugDecision(ResolveTargetSlug(productName, sku, facts), false, currentUrl);
    }

    private string ResolveTargetSlug(string productName, string? sku, V44Facts facts)
    {
        if (facts.UrlSlug?.Trim() is { Length: > 0 } explicitSlug)
        {
            return Slugify(explicitSlug);
        }

        var baseSlug = Slugify(productName);
        if (string.IsNullOrWhiteSpace(sku)) return baseSlug;

        var skuSlug = Slugify(sku);
        return string.IsNullOrWhiteSpace(skuSlug) ? baseSlug : $"{baseSlug}-{skuSlug}";
    }

    public static string Slugify(string value)
    {
        var decomposed = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            builder.Append(char.IsLetterOrDigit(ch) ? char.ToLowerInvariant(ch) : '-');
        }
        return Regex.Replace(builder.ToString(), "-+", "-").Trim('-');
    }

    // ---------------------------------------------------------------- keywords

    /// <summary>V4.4 §8: five comma-separated, product-focused keywords.</summary>
    private List<string> BuildKeywords(V44ExactEntity entity, string productName, string? sku)
    {
        var candidates = new[]
        {
            productName,
            $"{entity.Brand} {entity.Model} Reps",
            $"{entity.Colorway} {entity.ProductType}",
            sku ?? "",
            CategoryIntent(entity.ProductType),
        };

        var keywords = candidates
            .Select(Normalize)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(standard.KeywordCount)
            .ToList();

        // Keep five entries without duplicating an existing keyword.
        var fallbacks = new[] { $"{entity.Brand} {entity.ProductType}", $"{entity.Model} Reps", $"{productName} Reps" };
        foreach (var fallback in fallbacks)
        {
            if (keywords.Count >= standard.KeywordCount) break;
            var value = Normalize(fallback);
            if (string.IsNullOrWhiteSpace(value)) continue;
            if (keywords.Contains(value, StringComparer.OrdinalIgnoreCase)) continue;
            keywords.Add(value);
        }

        return keywords;
    }

    private static string CategoryIntent(string productType)
    {
        var value = productType.Trim().ToLowerInvariant();
        if (value.Contains("hoodie")) return "Streetwear Hoodies";
        if (value.Contains("jean")) return "Designer Jeans";
        if (value.Contains("short")) return "Streetwear Shorts";
        if (value.Contains("shirt")) return "Designer T-Shirts";
        if (value.Contains("sneaker") || value.Contains("shoe")) return "Designer Sneakers";
        return $"Designer {productType}".Trim();
    }

    // -------------------------------------------------------- key description

    private static V44DetailField ResolveFifthField(V44Facts facts, string? sku)
    {
        if (!string.IsNullOrWhiteSpace(sku))
        {
            // V4.4 §14: the fifth field is the SKU when it is verified.
            return new V44DetailField { Label = "SKU", Value = sku };
        }
        return facts.ProductDetailsFifth ?? new V44DetailField { Label = "", Value = "" };
    }

    /// <summary>
    /// V4.4 §12/§13: one concise sentence plus exactly five Product Details
    /// fields, with the Brand row carrying the verified internal link.
    /// The full product name is deliberately NOT repeated as a heading.
    /// </summary>
    private static string BuildKeyDescription(
        V44Facts facts,
        V44ExactEntity entity,
        string decisionSentence,
        V44DetailField fifth)
    {
        static string E(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

        var html = new StringBuilder();
        html.Append("<section class=\"ds-pdp-key-description\" data-standard=\"4.4\">");
        html.Append("<p>").Append(E(decisionSentence)).Append("</p>");
        html.Append("<h2>Product Details</h2><ul>");
        html.Append("<li><strong>Brand:</strong> <a href=\"")
            .Append(E(facts.BrandInternalUrl))
            .Append("\"><strong>").Append(E(entity.Brand)).Append("</strong></a></li>");
        html.Append("<li><strong>Product Type:</strong> ").Append(E(entity.ProductType)).Append("</li>");
        html.Append("<li><strong>Model:</strong> ").Append(E(entity.Model)).Append("</li>");
        html.Append("<li><strong>Colorway:</strong> ").Append(E(entity.Colorway)).Append("</li>");
        html.Append("<li><strong>").Append(E(fifth.Label)).Append(":</strong> ").Append(E(fifth.Value)).Append("</li>");
        html.Append("</ul></section>");
        return html.ToString();
    }

    // ------------------------------------------------------------ description

    private static List<string> BuildImageAlts(string productName, int imageCount)
    {
        var alts = new List<string>(imageCount);
        for (var index = 1; index <= imageCount; index++)
        {
            alts.Add(imageCount == 1 ? $"{productName} Product Image" : $"{productName} Product Image {index}");
        }
        return alts;
    }

    /// <summary>V4.4 §16: the backend Description field carries product images only.</summary>
    private static string BuildDescriptionHtml(IReadOnlyList<string> imageUrls, IReadOnlyList<string> imageAlts)
    {
        if (imageUrls.Count == 0) return "";

        var html = new StringBuilder();
        html.Append("<section class=\"ds-pdp-description\" data-standard=\"4.4\">");
        for (var index = 0; index < imageUrls.Count; index++)
        {
            var alt = imageAlts.Count > index ? imageAlts[index] : "";
            html.Append("<p><img src=\"")
                .Append(WebUtility.HtmlEncode(imageUrls[index]))
                .Append("\" alt=\"")
                .Append(WebUtility.HtmlEncode(alt))
                .Append("\" loading=\"lazy\" /></p>");
        }
        html.Append("</section>");
        return html.ToString();
    }

    // ------------------------------------------------------------------ schema

    private static string BuildSchema(V44ExactEntity entity, string productName, string? sku)
    {
        var payload = new Dictionary<string, object?>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "Product",
            ["name"] = productName,
            ["brand"] = new Dictionary<string, object?> { ["@type"] = "Brand", ["name"] = entity.Brand },
            ["category"] = entity.ProductType,
            ["color"] = entity.Colorway,
        };

        // V4.4 §20: include sku only when it is verified; otherwise omit entirely.
        if (!string.IsNullOrWhiteSpace(sku)) payload["sku"] = sku;

        return JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string Normalize(string value) =>
        Regex.Replace(value.Trim(), @"\s+", " ");
}
