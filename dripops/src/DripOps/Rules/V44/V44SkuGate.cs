using System.Text.RegularExpressions;

namespace DripOps.Rules.V44;

/// <summary>
/// Server-side SKU gate, mirroring the MCP plugin's gate byte-for-byte in intent.
///
/// V4.4 §5 forbids using these as a SKU: Drip product ID, supplier number, URL
/// suffix, image filename, listing ID, size, generated code — plus the literal
/// placeholders "Not verified" / "Unknown" / "Pending" / "N/A".
///
/// Shape checks deliberately stop at the unambiguous cases: Nike base style
/// codes are frequently all digits (528895, 528895-153 — the latter is a
/// production-verified SKU), so short pure-numeric values are NOT rejected on
/// shape alone. The evidence requirement carries that burden instead.
/// </summary>
public static class V44SkuGate
{
    private static readonly Regex[] ForbiddenPlaceholders =
    [
        new(@"^unknown$", RegexOptions.IgnoreCase),
        new(@"^n/?a$", RegexOptions.IgnoreCase),
        new(@"^pending$", RegexOptions.IgnoreCase),
        new(@"^not\s+verified$", RegexOptions.IgnoreCase),
        new(@"^unverified$", RegexOptions.IgnoreCase),
        new(@"^none$", RegexOptions.IgnoreCase),
        new(@"^null$", RegexOptions.IgnoreCase),
        new(@"^undefined$", RegexOptions.IgnoreCase),
        new(@"^tbd$", RegexOptions.IgnoreCase),
        new(@"^todo$", RegexOptions.IgnoreCase),
        new(@"^-+$"),
    ];

    private static readonly (Regex Pattern, string Reason)[] ForbiddenStructures =
    [
        (new(@"^536\d{12}$"), "MrShopPlus internal Product ID"),
        (new(@"^\d{12,}$"), "bare long numeric identifier (supplier / listing ID shape)"),
        (new(@"^https?://", RegexOptions.IgnoreCase), "URL"),
        (new(@"[/?#&=:%]"), "URL suffix or path fragment"),
        (new(@"\.(?:jpe?g|png|webp|gif|avif)$", RegexOptions.IgnoreCase), "image filename"),
        (new(@"^(?:gen|code|id|ref)[-_]?\d+$", RegexOptions.IgnoreCase), "generated code"),
    ];

    /// <summary>Returns the deterministic rejection reason, or null when acceptable.</summary>
    public static string? RejectionReason(string? rawSku)
    {
        var sku = (rawSku ?? string.Empty).Trim();
        if (sku.Length == 0) return "empty SKU";

        if (ForbiddenPlaceholders.Any(pattern => pattern.IsMatch(sku))) return "placeholder value";
        foreach (var (pattern, reason) in ForbiddenStructures)
        {
            if (pattern.IsMatch(sku)) return reason;
        }
        return null;
    }

    /// <summary>Full resolution check. Returns an empty list when the resolution is compliant.</summary>
    public static List<string> Validate(V44SkuResolution resolution)
    {
        var errors = new List<string>();
        var verdict = (resolution.Verdict ?? string.Empty).Trim().ToUpperInvariant();
        var sku = resolution.Sku?.Trim();

        switch (verdict)
        {
            case V44Verdict.VerifiedSku:
            {
                if (string.IsNullOrWhiteSpace(sku))
                {
                    errors.Add("VERIFIED_SKU requires a non-empty sku.");
                    break;
                }

                var reason = RejectionReason(sku);
                if (reason is not null)
                {
                    errors.Add($"SKU looks like an internal/placeholder identifier and is not allowed ({reason}).");
                }

                var strong = resolution.Evidence.Count(e =>
                    e.Tier is >= 1 and <= 4
                    && e.ExactEntityMatch
                    && string.Equals((e.Sku ?? string.Empty).Trim(), sku, StringComparison.Ordinal));
                if (strong == 0)
                {
                    errors.Add("VERIFIED_SKU requires at least one Tier 1-4 source that explicitly attaches the same SKU to the exact entity.");
                }
                break;
            }

            case V44Verdict.SkuOmit:
                if (resolution.Sku is not null)
                {
                    errors.Add("SKU_OMIT requires sku=null.");
                }
                break;

            case V44Verdict.Hold:
                if (resolution.Conflicts.Count == 0)
                {
                    errors.Add("HOLD requires at least one identity-critical conflict/reason.");
                }
                break;

            default:
                errors.Add($"verdict must be one of VERIFIED_SKU, SKU_OMIT, HOLD (received '{resolution.Verdict}').");
                break;
        }

        if (verdict != V44Verdict.Hold && resolution.Conflicts.Count > 0)
        {
            errors.Add("A non-HOLD resolution cannot carry unresolved identity-critical conflicts.");
        }

        if (resolution.Evidence.Count == 0)
        {
            errors.Add("at least one evidence record is required.");
        }

        if (string.IsNullOrWhiteSpace(resolution.DecisionNote))
        {
            errors.Add("decision_note is required.");
        }

        foreach (var field in new[]
                 {
                     (Name: "brand", Value: resolution.ExactEntity.Brand),
                     (Name: "model", Value: resolution.ExactEntity.Model),
                     (Name: "product_type", Value: resolution.ExactEntity.ProductType),
                     (Name: "colorway", Value: resolution.ExactEntity.Colorway),
                 })
        {
            if (string.IsNullOrWhiteSpace(field.Value)) errors.Add($"exact_entity.{field.Name} is required.");
        }

        return errors;
    }
}
