using System.Text.Json.Serialization;

namespace DripOps.Rules.V44;

/// <summary>V4.4 §5 / §5A: exactly three permitted SKU verdicts.</summary>
public static class V44Verdict
{
    public const string VerifiedSku = "VERIFIED_SKU";
    public const string SkuOmit = "SKU_OMIT";
    public const string Hold = "HOLD";
}

public sealed record V44Evidence
{
    public int Tier { get; init; }
    public string SourceName { get; init; } = "";
    public string Url { get; init; } = "";
    public string? ProductName { get; init; }
    public string? Sku { get; init; }
    public bool ExactEntityMatch { get; init; }
    public string? Notes { get; init; }
}

public sealed record V44ExactEntity
{
    public string Brand { get; init; } = "";
    public string Model { get; init; } = "";
    public string ProductType { get; init; } = "";
    public string Colorway { get; init; } = "";
    public string? CollaborationOrCollection { get; init; }
}

public sealed record V44SkuResolution
{
    public string Verdict { get; init; } = "";
    public V44ExactEntity ExactEntity { get; init; } = new();
    public string? Sku { get; init; }
    public List<V44Evidence> Evidence { get; init; } = [];
    public List<string> Conflicts { get; init; } = [];
    public string DecisionNote { get; init; } = "";

    [JsonIgnore]
    public bool IsHold => string.Equals(Verdict, V44Verdict.Hold, StringComparison.OrdinalIgnoreCase);
}

public sealed record V44DetailField
{
    public string Label { get; init; } = "";
    public string Value { get; init; } = "";
}

/// <summary>
/// Facts the research layer (ChatGPT) must supply before the bridge will compose.
/// Nothing here is inferred locally: a missing field produces an explicit
/// validation failure rather than a guess.
/// </summary>
public sealed record V44Facts
{
    /// <summary>Consumer-facing exact product name. Falls back to the exact entity when omitted.</summary>
    public string? ConsumerProductName { get; init; }

    /// <summary>V4.4 §12: one concise verified decision sentence for the Key Description.</summary>
    public string? DecisionSentence { get; init; }

    /// <summary>V4.4 §15: a real, crawlable Drip Sneakers internal link. Never invented.</summary>
    public string? BrandInternalUrl { get; init; }

    /// <summary>
    /// V4.4 §14: fifth Product Details field. When the SKU is verified this is the
    /// SKU; otherwise it must be a verified product-specific fact.
    /// </summary>
    public V44DetailField? ProductDetailsFifth { get; init; }

    /// <summary>Optional explicit slug. When omitted the bridge derives one from the entity.</summary>
    public string? UrlSlug { get; init; }

    /// <summary>V4.4 §10: set when an existing harmful URL must be migrated.</summary>
    public bool MigrateUrl { get; init; }

    /// <summary>
    /// Set when the operator wants the existing URL preserved verbatim even
    /// though it carries a harmful token. This is the Phase 8.1 safe-write
    /// mode: SEO fields are corrected while the URL, the canonical and the
    /// publish state stay untouched, so no 301 is required.
    ///
    /// It is an explicit opt-in and never a default, because the harmful-token
    /// migration rule in V4.4 §10 is the normal behaviour.
    /// </summary>
    public bool KeepExistingSlug { get; init; }

    public string? RedirectFrom { get; init; }
}

public sealed record V44Draft
{
    public string ProductName { get; init; } = "";
    public string H1 { get; init; } = "";
    public string SeoTitle { get; init; } = "";
    public List<string> Keywords { get; init; } = [];
    public string MetaDescription { get; init; } = "";
    public string Slug { get; init; } = "";
    public string CanonicalUrl { get; init; } = "";
    public bool UrlChangeRequired { get; init; }
    public string? RedirectFrom { get; init; }
    public string KeyDescriptionHtml { get; init; } = "";
    public string DescriptionHtml { get; init; } = "";
    public List<string> ImageAlts { get; init; } = [];
    public string SchemaJson { get; init; } = "";
}

public sealed record V44Check
{
    public string Code { get; init; } = "";
    public string Severity { get; init; } = "ERROR";
    public string Message { get; init; } = "";
}

public sealed record V44ValidationResult
{
    public string Status { get; init; } = "FAIL";
    public List<V44Check> Checks { get; init; } = [];

    [JsonIgnore]
    public bool IsPass => string.Equals(Status, "PASS", StringComparison.Ordinal);
}

public sealed record V44ExecutionResult
{
    public string RunId { get; init; } = "";
    public bool Published { get; init; }
    public string SaveStatus { get; init; } = "";
    public string ReadbackStatus { get; init; } = "";
    public string FrontendStatus { get; init; } = "";
    public List<V44Check> ReadbackChecks { get; init; } = [];
    public List<V44Check> FrontendChecks { get; init; } = [];
}

/// <summary>
/// Immutable plan. Created by prepare, consumed exactly once by execute.
/// Carries the snapshot and standard hashes so that any drift is detectable.
/// </summary>
public sealed record V44Plan
{
    public string PlanId { get; init; } = "";
    public string ProductId { get; init; } = "";
    public string RunId { get; init; } = "";
    public string AdminUrl { get; init; } = "";
    public string CreatedAt { get; init; } = "";
    public string Operation { get; init; } = "auto";

    public string StandardVersion { get; init; } = "";
    public string StandardHash { get; init; } = "";
    public string StandardFile { get; init; } = "";

    /// <summary>SHA-256 over the captured product snapshot the plan was built from.</summary>
    public string SnapshotHash { get; init; } = "";

    public string SkuVerdict { get; init; } = "";
    public string? Sku { get; init; }
    public V44SkuResolution SkuResolution { get; init; } = new();

    public V44Draft Draft { get; init; } = new();
    public Dictionary<string, string> ProposedChanges { get; init; } = [];

    public string ValidationStatus { get; init; } = "FAIL";
    public List<V44Check> Checks { get; init; } = [];

    public bool Executed { get; init; }
    public string? ExecutedAt { get; init; }
    public V44ExecutionResult? Execution { get; init; }

    public List<V44Check> Verification { get; init; } = [];
    public string? VerifiedAt { get; init; }
}
