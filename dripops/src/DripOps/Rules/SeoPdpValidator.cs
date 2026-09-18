using System.Net;
using System.Text.RegularExpressions;
using DripOps.Configuration;
using DripOps.Domain;

namespace DripOps.Rules;

public sealed class SeoPdpValidator
{
    private readonly MachineStandard _standard;
    private readonly DripOpsConfig _config;

    public SeoPdpValidator(MachineStandard standard, DripOpsConfig config)
    {
        _standard = standard;
        _config = config;
    }

    public ValidationResult Validate(ProductFacts facts, SeoDraft draft, ProductSnapshot? snapshot = null)
    {
        var issues = new List<ValidationIssue>();
        void Error(string code, string message) => issues.Add(new() { Code = code, Severity = "error", Message = message });
        void Warn(string code, string message) => issues.Add(new() { Code = code, Severity = "warning", Message = message });

        if (string.IsNullOrWhiteSpace(facts.Brand)) Error("FACT-01 UNVERIFIED_NAME", "Brand is missing.");
        if (string.IsNullOrWhiteSpace(facts.ModelName)) Error("FACT-01 UNVERIFIED_NAME", "Model name is missing.");
        if (string.IsNullOrWhiteSpace(facts.PrimaryColorway)) Error("FACT-03 DIRTY_COLORWAY", "Primary colorway is missing.");
        if (string.IsNullOrWhiteSpace(facts.Sku) || !facts.SkuVerified) Error("FACT-02 UNVERIFIED_SKU", "SKU is missing or not independently verified.");
        if (!facts.ImageMatchVerified) Error("FACT-04 IMAGE_MISMATCH", "Image match has not been verified.");
        if (facts.Evidence.Count == 0) Error("FACT-05 MISSING_EVIDENCE", "No field-level evidence was retained.");

        var expectedProductName = facts.DisplayProductName;
        if (!string.Equals(draft.ProductName, expectedProductName, StringComparison.Ordinal))
            Error("FORMAT-01 ENTITY_MISMATCH", $"Product name must be exactly: {expectedProductName}");

        var expectedTitle = $"{facts.BaseProductName} {facts.Sku} {_standard.TitleIntentTerm} | {_standard.SiteName}";
        if (!string.Equals(draft.SeoTitle, expectedTitle, StringComparison.Ordinal))
            Error("SEO-02 WRONG_TITLE_ORDER", $"SEO title must be exactly: {expectedTitle}");
        if (CountWholeTerm(draft.ProductName, facts.Sku) != 1)
            Error("NAME-02 SKU_COUNT", "Product Name must contain the verified SKU exactly once.");
        if (CountWholeTerm(draft.SeoTitle, facts.Sku) != 1)
            Error("SEO-02 DUPLICATED_SKU", "SEO Title must contain the verified SKU exactly once.");

        if (draft.Keywords.Count < _standard.KeywordsMin || draft.Keywords.Count > _standard.KeywordsMax)
            Error("SEO-05 KEYWORD_COUNT", $"Keywords must contain {_standard.KeywordsMin}-{_standard.KeywordsMax} values.");
        if (draft.Keywords.Distinct(StringComparer.OrdinalIgnoreCase).Count() != draft.Keywords.Count)
            Error("SEO-06 DUPLICATE_KEYWORD", "Keywords contain duplicates.");

        foreach (var required in new[] { expectedProductName, facts.Sku, "reps", _standard.SiteName })
        {
            if (!draft.MetaDescription.Contains(required, StringComparison.OrdinalIgnoreCase))
                Error("META-01 REQUIRED_ENTITY", $"Meta description is missing: {required}");
        }
        if (draft.MetaDescription.Length < _standard.MetaMinLength || draft.MetaDescription.Length > _standard.MetaMaxLength)
            Warn("META-02 SOFT_LENGTH", $"Meta length is {draft.MetaDescription.Length}; target is {_standard.MetaMinLength}-{_standard.MetaMaxLength}.");

        var stableLegacySlug = !draft.UrlChangeRequired && !string.IsNullOrWhiteSpace(draft.CurrentUrl) &&
                               string.Equals(draft.Slug.Trim('/'), draft.CurrentUrl.Trim('/'), StringComparison.Ordinal);
        if (!Regex.IsMatch(draft.Slug, _standard.SlugPattern, RegexOptions.CultureInvariant))
        {
            if (stableLegacySlug)
                Warn("URL-03 LEGACY_SLUG_PRESERVED", "Existing non-canonical slug was preserved under the 3.2 URL Stability rule.");
            else
                Error("URL-02 INVALID_SLUG", "New or migrated slug contains unsupported characters or separators.");
        }
        if (draft.UrlChangeRequired && string.IsNullOrWhiteSpace(draft.RedirectFrom))
            Error("URL-01 MIGRATION_INCOMPLETE", "A URL change requires redirectFrom.");

        var decodedHtml = WebUtility.HtmlDecode(draft.PdpHtml);
        if (!draft.PdpHtml.Contains($"data-version=\"{_standard.Version}\"", StringComparison.Ordinal))
            Error("FORMAT-02 WRONG_PDP_VERSION", "PDP HTML data-version is missing or incorrect.");
        if (Regex.Matches(draft.PdpHtml, "<h2(?:\\s|>)", RegexOptions.IgnoreCase).Count != 1)
            Error("FORMAT-03 H2_COUNT", "PDP HTML must contain exactly one H2.");
        if (!decodedHtml.Contains($"<h2>{expectedProductName}</h2>", StringComparison.OrdinalIgnoreCase))
            Error("FORMAT-01 ENTITY_MISMATCH", "PDP H2 does not match Product Name.");
        if (!draft.PdpHtml.Contains("<strong>Reference Style Code:</strong>", StringComparison.OrdinalIgnoreCase) ||
            !decodedHtml.Contains(facts.Sku, StringComparison.OrdinalIgnoreCase))
            Error("SEO-01 MISSING_SKU", "PDP details do not contain the verified SKU.");
        var linkCount = Regex.Matches(draft.PdpHtml, "<a\\s+[^>]*href=", RegexOptions.IgnoreCase).Count;
        if (linkCount != _standard.DefaultInternalLinks)
            Error("LINK-04 REDUNDANT_INTERNAL_LINK", $"PDP HTML must contain exactly {_standard.DefaultInternalLinks} internal Style link(s).");
        if (!Regex.IsMatch(draft.PdpHtml,
                $"<li><strong>Style:</strong>\\s*<a\\s+href=\"{Regex.Escape(facts.CategoryPath)}\"[^>]*>",
                RegexOptions.IgnoreCase))
            Error("LINK-01 UNVERIFIED_STYLE_URL", "The verified category/model link must be inside the Style field.");
        if (decodedHtml.Contains("Explore More", StringComparison.OrdinalIgnoreCase) ||
            decodedHtml.Contains("Related Products", StringComparison.OrdinalIgnoreCase) ||
            draft.PdpHtml.Contains("ds-related-products", StringComparison.OrdinalIgnoreCase))
            Error("FORMAT-02 WRONG_PDP_STRUCTURE", "Explore More and Related Products are disabled by default in 3.2.");

        var allOutput = string.Join("\n", draft.ProductName, draft.SeoTitle, string.Join(", ", draft.Keywords),
            draft.MetaDescription, draft.Slug, decodedHtml);
        foreach (var placeholder in _standard.ForbiddenPlaceholders)
        {
            if (allOutput.Contains(placeholder, StringComparison.OrdinalIgnoreCase))
                Error("LINK-02 PLACEHOLDER_URL", $"Forbidden placeholder found: {placeholder}");
        }
        foreach (var domain in _standard.ForbiddenDomains)
        {
            if (allOutput.Contains(domain, StringComparison.OrdinalIgnoreCase))
                Error("LINK-03 EXTERNAL_SUPPLIER_LINK", $"Forbidden domain found: {domain}");
        }

        foreach (var term in _standard.RiskTerms)
        {
            if (!ContainsWholeTerm(allOutput, term)) continue;
            var allowedOfficialEntity = _standard.OfficialEntityTermExceptions.Any(exception =>
                expectedProductName.Contains(exception, StringComparison.OrdinalIgnoreCase) &&
                exception.Contains(term, StringComparison.OrdinalIgnoreCase));
            if (!allowedOfficialEntity)
                Error("CONTENT-03 RISK_TERM", $"Risk term found outside an approved official entity name: {term}");
        }

        if (draft.RelatedProducts.Count > _standard.RelatedProductsMax)
            Error("LINK-05 RELATED_COUNT", $"Related product count exceeds {_standard.RelatedProductsMax}.");
        if (draft.RelatedProducts.Select(value => value.RelativeUrl).Distinct(StringComparer.OrdinalIgnoreCase).Count() != draft.RelatedProducts.Count)
            Error("LINK-06 RELATED_DUPLICATE", "Related product URLs contain duplicates.");
        if (draft.RelatedProducts.Any(value => !value.RelativeUrl.StartsWith('/')))
            Error("LINK-04 UNVERIFIED_RELATED_URL", "Related product URLs must be verified relative internal paths.");
        if (snapshot?.ImageUrls.Count == 0)
            Error("IMAGE-01 MISSING_IMAGE", "The product has no source images.");

        return new ValidationResult
        {
            IsValid = issues.All(issue => !string.Equals(issue.Severity, "error", StringComparison.OrdinalIgnoreCase)),
            Issues = issues
        };
    }

    private static bool ContainsWholeTerm(string text, string term)
    {
        if (term.Any(char.IsPunctuation)) return text.Contains(term, StringComparison.OrdinalIgnoreCase);
        return Regex.IsMatch(text, $@"(?<![A-Za-z0-9]){Regex.Escape(term)}(?![A-Za-z0-9])", RegexOptions.IgnoreCase);
    }

    private static int CountWholeTerm(string text, string term)
    {
        if (string.IsNullOrWhiteSpace(term)) return 0;
        return Regex.Matches(text, $@"(?<![A-Za-z0-9]){Regex.Escape(term)}(?![A-Za-z0-9])",
            RegexOptions.IgnoreCase).Count;
    }
}
