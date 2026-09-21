using DripOps.Domain;

namespace DripOps.Rules.V44;

/// <summary>One field from the Agent Contract V2.0 §4 read list.</summary>
public sealed record SnapshotFieldStatus
{
    public string Field { get; init; } = "";
    public bool Present { get; init; }

    /// <summary>
    /// The §4 stop condition this field belongs to, or null when §4 only asks for
    /// the field to be read. §4 names four stop conditions and several fields can
    /// share one — "Current SEO Fields" covers three separate values — so the
    /// condition is carried per field and grouped afterwards rather than being
    /// flattened into a per-field boolean.
    /// </summary>
    public string? StopCondition { get; init; }

    /// <summary>Where the value comes from, or why it cannot be read at all.</summary>
    public string Source { get; init; } = "";
}

public sealed record SnapshotCompleteness
{
    public string Contract { get; init; } = "AGENT_CONTRACT_V2.0";
    public string Section { get; init; } = "4";
    public bool Complete { get; init; }
    public List<SnapshotFieldStatus> Fields { get; init; } = [];

    /// <summary>The four §4 conditions, in the order §4 lists them.</summary>
    public List<string> StopConditions { get; init; } = [];
    public List<string> MissingStopConditions { get; init; } = [];
    public List<string> MissingAdvisory { get; init; } = [];
}

/// <summary>
/// Agent Contract V2.0 §4 — snapshot completeness.
///
/// §4 lists eighteen fields that must be read, then names four of them as a STOP
/// condition:
///
///     Product Images  /  Existing Description  /  Current SEO Fields  /  Variants
///
/// Everything else in the list is a read target whose absence degrades the
/// baseline without halting execution on its own.
///
/// The two are reported separately because they have different consequences. A
/// missing stop condition means the snapshot cannot support the identity decision
/// at all. A missing advisory field means the blast radius of a write cannot be
/// measured — the plan may still be safe, but nobody can prove it.
/// </summary>
public static class V44SnapshotCompleteness
{
    private const string Images = "images";
    private const string Description = "description";
    private const string SeoFields = "seo_fields";
    private const string Variants = "variants";

    /// <summary>§4 order, which is also the order the missing list is reported in.</summary>
    private static readonly string[] StopConditionOrder = [Images, Description, SeoFields, Variants];

    public static SnapshotCompleteness Evaluate(ProductSnapshot snapshot)
    {
        static bool Has(string value) => !string.IsNullOrWhiteSpace(value);
        var hasImages = snapshot.ImageUrls.Count > 0;

        var fields = new List<SnapshotFieldStatus>
        {
            Field("product_id", Has(snapshot.ProductId), null, "admin snapshot"),
            Field("current_product_name", Has(snapshot.ExistingName), null, "admin snapshot"),
            Field("current_url", Has(snapshot.ExistingSlug), null, "admin snapshot"),
            Field("current_sku", Has(snapshot.CurrentSku), null, "admin product form"),
            Field("supplier_code", Has(snapshot.SupplierCode), null, "admin product form"),
            Field("category", Has(snapshot.Category), null, "admin product form"),
            Field("price", Has(snapshot.Price), null, "admin product form"),
            Field("inventory", Has(snapshot.Inventory), null, "admin product form"),
            Field("collections", snapshot.Collections.Count > 0, null, "admin product form"),
            Field("variants", snapshot.Variants.Count > 0, Variants, "admin product form"),
            Field("description", Has(snapshot.ExistingDescriptionHtml), Description, "admin snapshot"),
            Field("key_description", false, null, "no reader in the stack"),
            Field("seo_title", Has(snapshot.ExistingSeoTitle), SeoFields, "admin snapshot (SEO dialog)"),
            Field("seo_keywords", snapshot.ExistingSeoKeywords.Count > 0, SeoFields, "admin snapshot (SEO dialog)"),
            Field("meta_description", Has(snapshot.ExistingMetaDescription), SeoFields, "admin snapshot (SEO dialog)"),
            Field("images", hasImages, Images, "admin snapshot"),
            Field("image_urls", hasImages, null, "admin snapshot"),
            Field("image_alt", false, null, "no reader in the stack"),
            Field("existing_schema", false, null, "storefront only, not in the admin snapshot"),
        };

        var missingStopConditions = StopConditionOrder
            .Where(condition => fields.Any(f => f.StopCondition == condition && !f.Present))
            .ToList();

        var missingAdvisory = fields
            .Where(f => f.StopCondition is null && !f.Present)
            .Select(f => f.Field)
            .ToList();

        return new SnapshotCompleteness
        {
            Complete = missingStopConditions.Count == 0,
            Fields = fields,
            StopConditions = [.. StopConditionOrder],
            MissingStopConditions = missingStopConditions,
            MissingAdvisory = missingAdvisory,
        };
    }

    private static SnapshotFieldStatus Field(string field, bool present, string? stopCondition, string source) =>
        new() { Field = field, Present = present, StopCondition = stopCondition, Source = source };
}
