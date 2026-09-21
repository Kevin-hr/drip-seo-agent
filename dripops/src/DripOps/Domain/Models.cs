using System.Text.Json.Serialization;

namespace DripOps.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AuditStatus
{
    Pass,
    Fix,
    Verify,
    Hold
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReleaseStatus
{
    Blocked,
    Ready,
    Saved,
    Published,
    Verified
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WorkflowStage
{
    Discovered,
    SnapshotCaptured,
    EvidenceRequired,
    FactsVerified,
    DraftGenerated,
    Validated,
    Saved,
    ReadBackVerified,
    Published,
    FrontendVerified,
    Failed
}

public sealed record EvidenceItem
{
    public required string Field { get; init; }
    public required string Value { get; init; }
    public required string SourceUrl { get; init; }
    public required string SourceTier { get; init; }
    public required DateTimeOffset VerifiedAt { get; init; }
    public string? Notes { get; init; }
}

public sealed record ProductFacts
{
    public string Brand { get; init; } = "";
    public string ModelName { get; init; } = "";
    public string PrimaryColorway { get; init; } = "";
    public string Sku { get; init; } = "";
    public string ProductType { get; init; } = "";
    public string? Collection { get; init; }
    public string? Style { get; init; }
    public string? Material { get; init; }
    public string? DesignDetails { get; init; }
    public string? Silhouette { get; init; }
    public string? UpperDesign { get; init; }
    public string? SignatureDetails { get; init; }
    public string? Midsole { get; init; }
    public string ProductIntro { get; init; } = "";
    public string BrandCategoryPath { get; init; } = "";
    public string CategoryPath { get; init; } = "";
    public bool ImageMatchVerified { get; init; }
    public bool SkuVerified { get; init; }
    public List<EvidenceItem> Evidence { get; init; } = [];

    [JsonIgnore]
    public string BaseProductName => string.Join(' ', new[] { Brand, ModelName, PrimaryColorway }
        .Where(value => !string.IsNullOrWhiteSpace(value)))
        .Replace("  ", " ", StringComparison.Ordinal)
        .Trim();

    [JsonIgnore]
    public string DisplayProductName => string.Join(' ', new[] { BaseProductName, Sku }
        .Where(value => !string.IsNullOrWhiteSpace(value)))
        .Replace("  ", " ", StringComparison.Ordinal)
        .Trim();
}

public sealed record RelatedProduct
{
    public required string ProductName { get; init; }
    public required string RelativeUrl { get; init; }
}

public sealed record SeoDraft
{
    public string ProductName { get; init; } = "";
    public string SeoTitle { get; init; } = "";
    public List<string> Keywords { get; init; } = [];
    public string MetaDescription { get; init; } = "";
    public string Slug { get; init; } = "";
    public string? CurrentUrl { get; init; }
    public string? CanonicalUrl { get; init; }
    public bool UrlChangeRequired { get; init; }
    public string? RedirectFrom { get; init; }
    public string PdpHtml { get; init; } = "";
    public List<RelatedProduct> RelatedProducts { get; init; } = [];
}

public sealed record ValidationIssue
{
    public required string Code { get; init; }
    public required string Severity { get; init; }
    public required string Message { get; init; }
}

public sealed record ValidationResult
{
    public bool IsValid { get; init; }
    public List<ValidationIssue> Issues { get; init; } = [];
}

public sealed record ProductSnapshot
{
    public required string ProductId { get; init; }
    public required string AdminUrl { get; init; }
    public string ExistingName { get; init; } = "";
    public string ExistingSubtitle { get; init; } = "";
    public string ExistingDescriptionHtml { get; init; } = "";
    public string ExistingSeoTitle { get; init; } = "";
    public List<string> ExistingSeoKeywords { get; init; } = [];
    public string ExistingMetaDescription { get; init; } = "";
    public string ExistingSlug { get; init; } = "";
    public string CurrentSku { get; init; } = "";
    public string SupplierCode { get; init; } = "";
    public string Category { get; init; } = "";
    public string Price { get; init; } = "";
    public string Inventory { get; init; } = "";
    public List<string> Collections { get; init; } = [];
    public List<string> Variants { get; init; } = [];
    public bool IsPublished { get; init; }
    public List<string> ImageUrls { get; init; } = [];
    public DateTimeOffset CapturedAt { get; init; } = DateTimeOffset.Now;
}

public sealed record ProductSeoReadback
{
    public string SeoTitle { get; init; } = "";
    public List<string> Keywords { get; init; } = [];
    public string MetaDescription { get; init; } = "";
    public string Slug { get; init; } = "";
}

public sealed record ProductJob
{
    public required string ProductId { get; init; }
    public required string AdminUrl { get; init; }
    public int CategoryIndex { get; init; }
    public WorkflowStage Stage { get; init; } = WorkflowStage.Discovered;
    public AuditStatus InputAuditStatus { get; init; } = AuditStatus.Verify;
    public ReleaseStatus ReleaseStatus { get; init; } = ReleaseStatus.Blocked;
    public ProductSnapshot? Snapshot { get; init; }
    public ProductFacts? Facts { get; init; }
    public SeoDraft? Draft { get; init; }
    public ValidationResult? Validation { get; init; }
    public List<string> FailureCodes { get; init; } = [];
    public DateTimeOffset UpdatedAt { get; init; } = DateTimeOffset.Now;
}

public sealed record CategoryProductRow
{
    public int Index { get; init; }
    public required string ProductId { get; init; }
    public required string Name { get; init; }
    public required string AdminUrl { get; init; }
    public bool IsPublished { get; init; }
}

public sealed record CategoryLookupResult
{
    public required string Name { get; init; }
    public required string AdminUrl { get; init; }
    public string? PublicUrl { get; init; }
}

public sealed record CategorySnapshot
{
    public required string CategoryAdminUrl { get; init; }
    public string CategoryName { get; init; } = "";
    public int Total { get; init; }
    public int Published { get; init; }
    public int Unpublished { get; init; }
    public List<CategoryProductRow> Products { get; init; } = [];
    public DateTimeOffset CapturedAt { get; init; } = DateTimeOffset.Now;
}

public sealed record RunState
{
    public required string RunId { get; init; }
    public required string StandardVersion { get; init; }
    public required string CategoryAdminUrl { get; init; }
    public string? CategoryPublicUrl { get; init; }
    public CategorySnapshot? CategorySnapshot { get; init; }
    public List<string> ProductIds { get; init; } = [];
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.Now;
    public DateTimeOffset UpdatedAt { get; init; } = DateTimeOffset.Now;
}
