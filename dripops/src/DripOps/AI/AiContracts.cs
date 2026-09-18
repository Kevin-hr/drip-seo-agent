using DripOps.Domain;

namespace DripOps.AI;

public sealed record AiJobRequest
{
    public required string RunId { get; init; }
    public required string StandardVersion { get; init; }
    public required ProductSnapshot Snapshot { get; init; }
    public ProductFacts? ExistingVerifiedFacts { get; init; }
    public string Instruction { get; init; } = "Apply SEO/PDP 3.2. Verify product name, colorway, SKU, image match, product-specific intro and the real category/model URL from retained evidence. Never guess supplier codes, SKU, materials, claims or URLs. Keep sticky verified facts unless conflicting evidence requires VERIFY. Return JSON only.";
}

public sealed record AiJobResponse
{
    public required string ProductId { get; init; }
    public AuditStatus AuditStatus { get; init; } = AuditStatus.Verify;
    public ProductFacts? Facts { get; init; }
    public List<string> FailureCodes { get; init; } = [];
    public string? Notes { get; init; }
    public string? ProviderName { get; init; }
    public string? ModelName { get; init; }
}

public interface IAiProvider
{
    string Name { get; }
    Task<AiJobResponse> EnrichAsync(AiJobRequest request, CancellationToken cancellationToken);
}
