using System.Text.RegularExpressions;

namespace DripOps.Rules.V44;

/// <summary>
/// Storefront-side V4.4 acceptance checks.
///
/// This supplements — it does not replace — the existing FrontendVerifier
/// (HTTP status, H1, meta, canonical, noindex, JSON-LD). It adds the
/// V4.4-specific placement requirements from §12, §15, §16 and §17 that the
/// existing verifier does not cover.
/// </summary>
public sealed class V44FrontendAuditor(V44Standard standard)
{
    public List<V44Check> Audit(string html, V44Draft draft)
    {
        var checks = new List<V44Check>();

        if (Regex.IsMatch(html, @"noindex", RegexOptions.IgnoreCase))
        {
            checks.Add(Error("FE-01 NOINDEX", "Storefront HTML contains noindex."));
        }

        // §12 / §18: Key Description = decision sentence + Product Details, in the DOM.
        if (!Regex.IsMatch(html, @"<h2[^>]*>\s*Product Details\s*</h2>", RegexOptions.IgnoreCase))
        {
            checks.Add(Error("FE-02 PRODUCT_DETAILS_MISSING", "Rendered HTML has no <h2>Product Details</h2> block."));
        }

        var keyDescriptionUl = ExtractProductDetailsList(html);
        if (keyDescriptionUl is null)
        {
            checks.Add(Error("FE-03 PRODUCT_DETAILS_LIST_MISSING", "Could not find the Product Details list in the rendered HTML."));
        }
        else
        {
            var items = Regex.Matches(keyDescriptionUl, @"<li\b", RegexOptions.IgnoreCase).Count;
            if (items != standard.ProductDetailsFieldCount)
            {
                checks.Add(Error("FE-04 PRODUCT_DETAILS_COUNT",
                    $"Product Details must render exactly {standard.ProductDetailsFieldCount} items; found {items}."));
            }

            if (!Regex.IsMatch(keyDescriptionUl, @"<a\s+[^>]*href=""[^""]*dripsneakers\.org", RegexOptions.IgnoreCase))
            {
                checks.Add(Error("FE-05 BRAND_LINK_MISSING", "The Brand row has no crawlable Drip Sneakers internal link."));
            }
        }

        // §17: the placement model is valid only when the text is real crawlable HTML.
        if (!Regex.IsMatch(html, @"<p>[^<]{20,}</p>", RegexOptions.IgnoreCase))
        {
            checks.Add(Warn("FE-06 DECISION_SENTENCE_NOT_FOUND", "Could not find a plain decision sentence in the rendered HTML."));
        }

        // §16: Description = images only, each with ALT.
        var descriptionImages = Regex.Matches(html, @"<img\b[^>]*>", RegexOptions.IgnoreCase);
        if (descriptionImages.Count == 0)
        {
            checks.Add(Warn("FE-07 NO_IMAGES", "No <img> elements were found in the rendered HTML."));
        }
        else
        {
            var missingAlt = descriptionImages
                .Select(match => match.Value)
                .Count(tag => !Regex.IsMatch(tag, @"\balt\s*=\s*""[^""]+""", RegexOptions.IgnoreCase));
            if (missingAlt > 0)
            {
                checks.Add(Error("FE-08 IMAGE_ALT_MISSING", $"{missingAlt} product image(s) render without ALT text."));
            }
        }

        // §6 / §23: banned wording must not reach the storefront.
        foreach (var term in standard.ForbiddenSupplierTerms)
        {
            if (Regex.IsMatch(html, $@"(?<![A-Za-z0-9]){Regex.Escape(term)}(?![A-Za-z0-9])", RegexOptions.IgnoreCase))
            {
                checks.Add(Error("FE-09 FORBIDDEN_TERM", $"Rendered HTML contains wording banned by V4.4 §6: '{term}'."));
            }
        }

        if (!string.IsNullOrWhiteSpace(draft.CanonicalUrl))
        {
            var canonical = Regex.Match(html,
                @"<link[^>]+rel=[""']canonical[""'][^>]+href=[""']([^""']*)", RegexOptions.IgnoreCase).Groups[1].Value;
            if (!string.IsNullOrWhiteSpace(canonical)
                && !string.Equals(canonical.TrimEnd('/'), draft.CanonicalUrl.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(Error("FE-10 CANONICAL_MISMATCH", $"Canonical mismatch. Found: {canonical}"));
            }
        }

        return checks;
    }

    /// <summary>Returns the <c>&lt;ul&gt;</c> that directly follows the Product Details heading.</summary>
    private static string? ExtractProductDetailsList(string html)
    {
        var heading = Regex.Match(html, @"<h2[^>]*>\s*Product Details\s*</h2>", RegexOptions.IgnoreCase);
        if (!heading.Success) return null;

        var list = Regex.Match(html[heading.Index..], @"<ul\b[^>]*>(.*?)</ul>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return list.Success ? list.Groups[1].Value : null;
    }

    private static V44Check Error(string code, string message) => new() { Code = code, Severity = "ERROR", Message = message };
    private static V44Check Warn(string code, string message) => new() { Code = code, Severity = "WARN", Message = message };
}
