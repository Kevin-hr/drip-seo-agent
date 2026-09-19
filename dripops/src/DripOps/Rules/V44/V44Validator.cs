using System.Text.Json;
using System.Text.RegularExpressions;

namespace DripOps.Rules.V44;

/// <summary>
/// Deterministic V4.4 validator — a machine-checkable projection of the
/// three-pass audit in Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
/// (§23) plus the §26 final gate.
///
/// WARN findings are recorded but do not block PASS. ERROR findings do.
/// </summary>
public sealed class V44Validator(V44Standard standard)
{
    /// <param name="existingSlug">
    /// The slug the product already has on the storefront, when known. Supplying
    /// it lets the URL layer distinguish "this plan proposes a bad slug" from
    /// "this plan carries a legacy slug it is deliberately not changing".
    /// </param>
    public V44ValidationResult Validate(V44Draft draft, V44SkuResolution resolution, string? existingSlug = null)
    {
        var checks = new List<V44Check>();
        var verdict = (resolution.Verdict ?? "").Trim().ToUpperInvariant();
        var sku = resolution.Sku?.Trim();

        // ---------------------------------------------------------- Pass 1: entity
        if (string.IsNullOrWhiteSpace(draft.ProductName))
        {
            checks.Add(Error("PRODUCT-01", "Product Name is empty."));
        }

        CheckForbiddenTerms(checks, "NAME", draft.ProductName, "Product Name");

        if (!string.IsNullOrWhiteSpace(draft.H1) && !string.Equals(draft.H1, draft.ProductName, StringComparison.Ordinal))
        {
            checks.Add(Error("H1-01", "H1 must equal the locked Product Name (V4.4 §6)."));
        }

        // ------------------------------------------------------- Pass 2: evidence
        if (verdict == V44Verdict.VerifiedSku)
        {
            if (string.IsNullOrWhiteSpace(sku))
            {
                checks.Add(Error("SKU-01", "VERIFIED_SKU verdict but the draft carries no SKU."));
            }
            else if (!draft.SeoTitle.Contains(sku, StringComparison.Ordinal))
            {
                checks.Add(Error("SKU-02", "SEO Title must contain the verified SKU."));
            }
        }
        else if (verdict == V44Verdict.SkuOmit)
        {
            var leaked = FindSupplierIdentifierLeak(draft);
            if (leaked is not null)
            {
                checks.Add(Error("SKU-03", $"SKU_OMIT verdict but the draft carries an identifier-looking value: {leaked}"));
            }
        }

        if (string.IsNullOrWhiteSpace(resolution.DecisionNote))
        {
            checks.Add(Error("EVID-01", "decision_note is required."));
        }
        if (resolution.Evidence.Count == 0)
        {
            checks.Add(Error("EVID-02", "at least one evidence record is required."));
        }

        // ------------------------------------------------------- Pass 3: SEO layer
        var expectedTitle = standard.SeoTitle(draft.ProductName, verdict == V44Verdict.VerifiedSku ? sku : null);
        if (!string.Equals(draft.SeoTitle, expectedTitle, StringComparison.Ordinal))
        {
            checks.Add(Error("SEO-01", $"SEO Title does not match the V4.4 template. expected='{expectedTitle}' actual='{draft.SeoTitle}'"));
        }
        if (!string.IsNullOrWhiteSpace(sku) && CountWholeToken(draft.SeoTitle, sku) != 1)
        {
            checks.Add(Error("SEO-02", "SEO Title must contain the verified SKU exactly once (V4.4 §13)."));
        }

        if (draft.Keywords.Count != standard.KeywordCount)
        {
            checks.Add(Error("KW-01", $"V4.4 §8 requires {standard.KeywordCount} keywords; found {draft.Keywords.Count}."));
        }
        if (draft.Keywords.Distinct(StringComparer.OrdinalIgnoreCase).Count() != draft.Keywords.Count)
        {
            checks.Add(Error("KW-02", "SEO Keywords must not contain duplicates."));
        }
        foreach (var keyword in draft.Keywords) CheckForbiddenTerms(checks, "KW", keyword, "SEO Keywords");

        var expectedMeta = standard.MetaDescription(draft.ProductName, verdict == V44Verdict.VerifiedSku ? sku : null);
        if (!string.Equals(draft.MetaDescription, expectedMeta, StringComparison.Ordinal))
        {
            checks.Add(Error("META-01", $"Meta Description does not match the V4.4 §9 template. expected='{expectedMeta}' actual='{draft.MetaDescription}'"));
        }
        foreach (var phrase in standard.MetaForbiddenPhrases)
        {
            if (draft.MetaDescription.Contains(phrase, StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(Error("META-02", $"Meta Description uses a claim V4.4 §9 forbids without separate verification: '{phrase}'."));
            }
        }
        foreach (var assurance in standard.MetaApprovedAssurances)
        {
            if (!draft.MetaDescription.Contains(assurance, StringComparison.Ordinal))
            {
                checks.Add(Error("META-03", $"Meta Description is missing required purchase-assurance wording: '{assurance}'."));
            }
        }

        // ------------------------------------------------------------- URL layer
        //
        // URL-01 gates the slug this plan proposes to publish, not one that is
        // already live and is being left alone.
        //
        // When a plan changes no URL and carries the product's existing identifier
        // verbatim, a pattern violation is a pre-existing condition. Recording it as
        // ERROR would make "correct the SEO fields, touch nothing else" impossible
        // to validate — which is precisely the mode P0-1 exists to protect, because
        // legacy storefront slugs are frequently title-cased. The finding is kept as
        // a WARN so it stays visible and is fixed in a dedicated URL pass.
        var slugIsUnchangedExisting =
            !draft.UrlChangeRequired
            && !string.IsNullOrWhiteSpace(existingSlug)
            && string.Equals(draft.Slug.Trim().Trim('/'), existingSlug.Trim().Trim('/'), StringComparison.Ordinal);

        if (!Regex.IsMatch(draft.Slug, standard.SlugPattern))
        {
            if (slugIsUnchangedExisting)
            {
                checks.Add(Warn("URL-01",
                    $"Slug '{draft.Slug}' violates the lowercase ASCII pattern, but this plan does not change the URL. " +
                    "The violation is a pre-existing storefront condition, recorded for transparency. " +
                    "Migrate it in a dedicated URL pass."));
            }
            else
            {
                checks.Add(Error("URL-01", $"Slug '{draft.Slug}' violates the lowercase ASCII pattern."));
            }
        }
        if (draft.UrlChangeRequired && string.IsNullOrWhiteSpace(draft.RedirectFrom))
        {
            checks.Add(Error("URL-02", "A URL migration requires redirectFrom (V4.4 §10)."));
        }
        if (!string.Equals(draft.CanonicalUrl, standard.CanonicalUrl(draft.Slug), StringComparison.Ordinal))
        {
            checks.Add(Error("URL-03", "Canonical URL must equal the origin plus the final slug."));
        }

        // --------------------------------------------------- key description layer
        ValidateKeyDescription(checks, draft);

        // ---------------------------------------------------------- description
        if (!string.IsNullOrWhiteSpace(draft.DescriptionHtml))
        {
            if (Regex.IsMatch(draft.DescriptionHtml, @"<(h1|h2|h3|ul|ol)\b", RegexOptions.IgnoreCase))
            {
                checks.Add(Error("DESC-01", "Backend Description must contain product images only (V4.4 §16)."));
            }
        }

        // ----------------------------------------------------------------- schema
        ValidateSchema(checks, draft, verdict == V44Verdict.VerifiedSku && !string.IsNullOrWhiteSpace(sku));

        // --------------------------------------------------- global word-level bans
        CheckForbiddenTerms(checks, "META", draft.MetaDescription, "Meta Description");
        CheckForbiddenTerms(checks, "KD", draft.KeyDescriptionHtml, "Key Description");

        var errors = checks.Count(c => c.Severity == "ERROR");
        return new V44ValidationResult
        {
            Status = errors == 0 ? "PASS" : "FAIL",
            Checks = checks,
        };
    }

    // ------------------------------------------------------------------ helpers

    private void ValidateKeyDescription(List<V44Check> checks, V44Draft draft)
    {
        var html = draft.KeyDescriptionHtml;
        if (string.IsNullOrWhiteSpace(html))
        {
            checks.Add(Error("KD-01", "Key Description is empty."));
            return;
        }

        if (!Regex.IsMatch(html, @"<h2>\s*Product Details\s*</h2>", RegexOptions.IgnoreCase))
        {
            checks.Add(Error("KD-02", "Key Description must contain <h2>Product Details</h2> (V4.4 §12)."));
        }

        var items = Regex.Matches(html, @"<li\b", RegexOptions.IgnoreCase).Count;
        if (items != standard.ProductDetailsFieldCount)
        {
            checks.Add(Error("KD-03", $"Key Description must contain exactly {standard.ProductDetailsFieldCount} Product Details fields; found {items}."));
        }

        var brandRow = Regex.Match(
            html,
            @"<li>\s*<strong>\s*Brand\s*:?\s*</strong>\s*<a\s+href=""([^""]+)""[^>]*>\s*<strong>([^<]+)</strong>\s*</a>",
            RegexOptions.IgnoreCase);
        if (!brandRow.Success)
        {
            checks.Add(Error("KD-04", "The Brand row must be a real internal link whose anchor text is <strong> (V4.4 §15)."));
        }
        else
        {
            var href = brandRow.Groups[1].Value;
            var anchor = brandRow.Groups[2].Value.Trim();
            if (!href.StartsWith(standard.StoreOrigin, StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(Error("KD-05", $"The Brand link must point at a Drip Sneakers page; found '{href}'."));
            }
            var brand = draft.ProductName.Split(' ').FirstOrDefault() ?? "";
            if (!string.IsNullOrWhiteSpace(brand) && !anchor.Contains(brand, StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(Error("KD-06", $"The Brand anchor text must carry the real brand name; found '{anchor}'."));
            }
        }

        // V4.4 §13: no mechanical repetition of the full Product Name as a heading.
        if (Regex.IsMatch(html, $@"<h[1-4][^>]*>\s*{Regex.Escape(draft.ProductName)}\s*</h[1-4]>", RegexOptions.IgnoreCase))
        {
            checks.Add(Error("KD-07", "Key Description must not repeat the full Product Name as a heading (V4.4 §13)."));
        }

        var sentence = Regex.Match(html, @"<p>(.*?)</p>", RegexOptions.Singleline);
        if (!sentence.Success || sentence.Groups[1].Value.Trim().Length < 20)
        {
            checks.Add(Error("KD-08", "Key Description must open with one concise natural-language decision sentence (V4.4 §12)."));
        }

        if (draft.ImageAlts.Count == 0)
        {
            checks.Add(Warn("ALT-01", "No product images were present in the snapshot, so no image ALT was generated."));
        }
        else if (draft.ImageAlts.All(alt => Regex.IsMatch(alt, @"\bImage\s*\d*$", RegexOptions.IgnoreCase)))
        {
            checks.Add(Warn("ALT-02", "Image ALT is generic. V4.4 §21 wants Product Name + View/Detail; supply specific view labels before publishing."));
        }
        foreach (var alt in draft.ImageAlts) CheckForbiddenTerms(checks, "ALT", alt, "Image ALT");
    }

    private static void ValidateSchema(List<V44Check> checks, V44Draft draft, bool skuVerified)
    {
        if (string.IsNullOrWhiteSpace(draft.SchemaJson)) return;

        JsonElement root;
        try
        {
            root = JsonDocument.Parse(draft.SchemaJson).RootElement;
        }
        catch (JsonException)
        {
            checks.Add(Error("SCH-01", "Product Schema is not valid JSON."));
            return;
        }

        foreach (var property in new[] { "name", "brand", "category", "color" })
        {
            if (!root.TryGetProperty(property, out _))
            {
                checks.Add(Error("SCH-02", $"Product Schema is missing required property '{property}' (V4.4 §20)."));
            }
        }

        var hasSku = root.TryGetProperty("sku", out var skuElement)
            && skuElement.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(skuElement.GetString());
        if (hasSku && !skuVerified)
        {
            checks.Add(Error("SCH-03", "Product Schema carries a sku but no SKU was verified (V4.4 §20)."));
        }
        if (!hasSku && skuVerified)
        {
            checks.Add(Error("SCH-04", "Product Schema omits sku although a SKU was verified (V4.4 §20)."));
        }
    }

    /// <summary>V4.4 §6/§23: supplier wording and gender/sizing tokens are banned in public identity fields.</summary>
    private void CheckForbiddenTerms(List<V44Check> checks, string prefix, string value, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) return;

        foreach (var term in standard.ForbiddenSupplierTerms)
        {
            if (ContainsWholeTerm(value, term))
            {
                checks.Add(Error($"{prefix}-S1", $"{field} contains supplier/marketing wording banned by V4.4 §6: '{term}'."));
            }
        }
        foreach (var term in standard.ForbiddenIdentityTerms)
        {
            if (ContainsWholeTerm(value, term))
            {
                checks.Add(Error($"{prefix}-G1", $"{field} contains a gender/sizing-class token banned by V4.4 §6: '{term}'."));
            }
        }
        foreach (var domain in standard.ForbiddenDomains)
        {
            if (value.Contains(domain, StringComparison.OrdinalIgnoreCase))
            {
                checks.Add(Error($"{prefix}-D1", $"{field} references a forbidden domain: '{domain}'."));
            }
        }
    }

    private static bool ContainsWholeTerm(string haystack, string term) =>
        Regex.IsMatch(haystack, $@"(?<![A-Za-z0-9]){Regex.Escape(term)}(?![A-Za-z0-9])", RegexOptions.IgnoreCase);

    private static int CountWholeToken(string haystack, string token) =>
        Regex.Matches(haystack, $@"(?<![A-Za-z0-9-]){Regex.Escape(token)}(?![A-Za-z0-9-])", RegexOptions.IgnoreCase).Count;

    private static string? FindSupplierIdentifierLeak(V44Draft draft)
    {
        var candidates = new List<string> { draft.ProductName, draft.SeoTitle, draft.MetaDescription, draft.Slug };
        candidates.AddRange(draft.Keywords);
        candidates.Add(draft.CanonicalUrl);

        foreach (var candidate in candidates)
        {
            foreach (Match match in Regex.Matches(candidate, @"\b536\d{12}\b"))
            {
                return match.Value;
            }
            foreach (Match match in Regex.Matches(candidate, @"\b\d{12,}\b"))
            {
                return match.Value;
            }
        }
        return null;
    }

    private static V44Check Error(string code, string message) => new() { Code = code, Severity = "ERROR", Message = message };
    private static V44Check Warn(string code, string message) => new() { Code = code, Severity = "WARN", Message = message };
}
