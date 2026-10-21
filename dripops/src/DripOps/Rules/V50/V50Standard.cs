using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace DripOps.Rules.V50;

/// <summary>
/// Candidate V5.0 policy loader. Deliberately not wired to BridgeServer:
/// V4.4 remains the production execution path until the guarded promotion PR.
/// </summary>
public sealed class V50Standard
{
    public const string FileName = "Drip_Sneakers_SEO-PDP_V5.0_STANDARD_FINAL.md";
    public const string PinnedSha256 = "72263e2cefb63e50de74be1bc0e40aa6a3ed06a3e7b55bc72eb9f4b662d6a172";
    public string Version => "5.0";
    public string DocumentHash { get; private init; } = "";
    public bool ProductionWritesEnabled => false;

    public static V50Standard LoadPreview(string markdownPath)
    {
        if (Path.GetFileName(markdownPath) != FileName)
            throw new InvalidOperationException("V5.0 must load the exact canonical document filename.");
        var bytes = File.ReadAllBytes(markdownPath);
        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        if (!string.Equals(hash, PinnedSha256, StringComparison.Ordinal))
            throw new InvalidOperationException("V5.0 standard digest mismatch: fail closed.");
        var text = Encoding.UTF8.GetString(bytes);
        if (!Regex.IsMatch(text, @"(?m)^\*\*版本：\*\*\s*5\.0\s*$"))
            throw new InvalidOperationException("V5.0 version declaration not found.");
        if (!text.Contains("# 附录 A｜SEO-PDP V4.6 完整规范原文", StringComparison.Ordinal))
            throw new InvalidOperationException("V4.6 appendix missing.");
        return new V50Standard { DocumentHash = hash };
    }
}

public sealed record V50AcceptanceFacts
{
    public bool ImageActuallyReviewed { get; init; }
    public bool IndependentExactEntityEvidence { get; init; }
    public bool SkuIndependentlyVerified { get; init; }
    public string SkuVerdict { get; init; } = "HOLD";
    public string? Sku { get; init; }
    public string SoldUnit { get; init; } = "";
    public string SelectedUnit { get; init; } = "";
    public bool VariantChecked { get; init; }
    public bool SizeChecked { get; init; }
    public bool CheckoutChecked { get; init; }
    public bool SubtitleMatchesPurchaseUnit { get; init; }
    public bool VariantPriceChecked { get; init; }
    public bool SchemaOfferMatchesFrontend { get; init; }
    public string MetaDescription { get; init; } = "";
    public string KeyDescriptionHtml { get; init; } = "";
    public bool BrandLinkLiveVerified { get; init; }
    public string Brand { get; init; } = "";
    public string BrandLink { get; init; } = "";
    public string Slug { get; init; } = "";
    public string CanonicalUrl { get; init; } = "";
    public bool Mobile360Checked { get; init; }
    public bool Tablet768Checked { get; init; }
    public bool MediaChecked { get; init; }
    public bool SchemaChecked { get; init; }
}

/// <summary>Standalone fail-closed gate used by preview tests, not by live routes.</summary>
public static class V50AcceptanceGate
{
    public static IReadOnlyList<string> Evaluate(V50AcceptanceFacts facts)
    {
        var errors = new List<string>();
        if (!facts.ImageActuallyReviewed || !facts.IndependentExactEntityEvidence)
            errors.Add("EXACT_ENTITY_NOT_PROVEN");
        if (facts.SkuVerdict is not ("VERIFIED_SKU" or "SKU_OMIT"))
            errors.Add("SKU_HOLD");
        if (facts.SkuVerdict == "VERIFIED_SKU" &&
            (!facts.SkuIndependentlyVerified || string.IsNullOrWhiteSpace(facts.Sku)))
            errors.Add("SKU_NOT_VERIFIED");
        if (facts.SkuVerdict == "SKU_OMIT" && !string.IsNullOrWhiteSpace(facts.Sku))
            errors.Add("SKU_MUST_BE_OMITTED");
        if (string.IsNullOrWhiteSpace(facts.SoldUnit) ||
            !string.Equals(facts.SoldUnit, facts.SelectedUnit, StringComparison.Ordinal))
            errors.Add("PURCHASE_UNIT_MISMATCH");
        if (!facts.VariantChecked || !facts.SizeChecked || !facts.CheckoutChecked || !facts.VariantPriceChecked)
            errors.Add("PURCHASE_PATH_UNVERIFIED");
        if (!facts.SubtitleMatchesPurchaseUnit) errors.Add("SUBTITLE_UNIT_MISMATCH");
        if (!facts.SchemaOfferMatchesFrontend) errors.Add("SCHEMA_OFFER_MISMATCH");
        if (!facts.MetaDescription.Contains("reps", StringComparison.OrdinalIgnoreCase) ||
            !facts.MetaDescription.Contains("QC photos", StringComparison.OrdinalIgnoreCase) ||
            !facts.MetaDescription.Contains("30-day returns", StringComparison.OrdinalIgnoreCase) ||
            !facts.MetaDescription.Contains("7–20 day shipping", StringComparison.OrdinalIgnoreCase))
            errors.Add("META_V46_CONTRACT");
        if (!Regex.IsMatch(facts.KeyDescriptionHtml, @"<h2>\s*Product Details\s*</h2>", RegexOptions.IgnoreCase) ||
            Regex.Matches(facts.KeyDescriptionHtml, @"<li\b", RegexOptions.IgnoreCase).Count != 5)
            errors.Add("KEY_DESCRIPTION_FIVE_DETAILS");
        if (!facts.BrandLinkLiveVerified || !Regex.IsMatch(facts.BrandLink, @"^/[A-Za-z0-9-]+/$"))
            errors.Add("BRAND_LINK_NOT_VERIFIED_RELATIVE");
        if (string.Equals(facts.Brand, "Chanel", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(facts.BrandLink, "/Chanel/", StringComparison.Ordinal))
            errors.Add("CHANEL_FIXED_LINK");
        if (!Regex.IsMatch(facts.Slug, @"^[a-z0-9]+(?:-[a-z0-9]+)*$"))
            errors.Add("SLUG_NOT_SLUG_ONLY");
        if (facts.CanonicalUrl != $"https://www.dripsneakers.org/{facts.Slug}")
            errors.Add("CANONICAL_NOT_PREFERRED_URL");
        if (!facts.Mobile360Checked || !facts.Tablet768Checked)
            errors.Add("MOBILE_NOT_VERIFIED");
        if (!facts.MediaChecked || !facts.SchemaChecked)
            errors.Add("MEDIA_SCHEMA_NOT_VERIFIED");
        return errors;
    }
}
