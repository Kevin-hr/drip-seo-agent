using DripOps.Rules.V44;

namespace DripOps.Bridge;

/// <summary>Common fields the MCP plugin attaches to every bridge call.</summary>
public abstract record BridgeRequestBase
{
    public string? StandardVersion { get; init; }
    public string? StandardHash { get; init; }
    public string? StandardFile { get; init; }
}

public sealed record ProductSearchRequest : BridgeRequestBase
{
    public string Query { get; init; } = "";
    public string Status { get; init; } = "all";
    public int Limit { get; init; } = 30;
}

public sealed record ProductReadRequest : BridgeRequestBase
{
    public string ProductId { get; init; } = "";
    /// <summary>Opt in to a live MrShopPlus read when no local checkpoint exists.</summary>
    public bool Live { get; init; }
}

public sealed record ProductPrepareRequest : BridgeRequestBase
{
    public string ProductId { get; init; } = "";
    public V44SkuResolution SkuResolution { get; init; } = new();
    public string Operation { get; init; } = "auto";
    public string? UserInstruction { get; init; }

    /// <summary>
    /// Explicit wire name: the MCP plugin sends `v44_facts`, and this must not rely
    /// on automatic snake_case conversion of the "V44Facts" identifier.
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("v44_facts")]
    public V44Facts? V44Facts { get; init; }

    public string? RunId { get; init; }
    /// <summary>Opt in to a live MrShopPlus snapshot when no local checkpoint exists.</summary>
    public bool Live { get; init; }
}

/// <summary>
/// V4.4 write contract: only product_id + plan_id are accepted. Arbitrary SEO
/// fields are impossible to express, which is the structural guarantee that the
/// dry-run gate cannot be bypassed.
/// </summary>
public sealed record ProductExecuteRequest : BridgeRequestBase
{
    public string ProductId { get; init; } = "";
    public string PlanId { get; init; } = "";
}

public sealed record ProductVerifyRequest : BridgeRequestBase
{
    public string ProductId { get; init; } = "";
    public string? PlanId { get; init; }
    public string? RunId { get; init; }
}

public sealed record RunStatusRequest : BridgeRequestBase
{
    public string RunId { get; init; } = "";
}

public sealed record BridgeError
{
    public bool Ok { get; init; }
    public string Error { get; init; } = "";
    public string? Detail { get; init; }
    public List<V44Check> Checks { get; init; } = [];
    public List<string> GateErrors { get; init; } = [];
}

public sealed record ProductSearchHit
{
    public string ProductId { get; init; } = "";
    public string Name { get; init; } = "";
    public string AdminUrl { get; init; } = "";
    public string RunId { get; init; } = "";
    public bool IsPublished { get; init; }
    public string Stage { get; init; } = "";
    public string AuditStatus { get; init; } = "";
    public string ReleaseStatus { get; init; } = "";
    public string UpdatedAt { get; init; } = "";
    public int ImageCount { get; init; }
}

public sealed record ProductSearchResponse
{
    public List<ProductSearchHit> Products { get; init; } = [];
    public int TotalScanned { get; init; }
    public string Source { get; init; } = "local-checkpoints";
}

public sealed record RunStatusResponse
{
    public string RunId { get; init; } = "";
    public string Status { get; init; } = "UNKNOWN";
    public string StandardVersion { get; init; } = "";
    public string CreatedAt { get; init; } = "";
    public string UpdatedAt { get; init; } = "";
    public int Total { get; init; }
    public int Published { get; init; }
    public int Pass { get; init; }
    public int Hold { get; init; }
    public int Failed { get; init; }
    public int Pending { get; init; }
    public List<RunStatusProduct> Products { get; init; } = [];
}

public sealed record RunStatusProduct
{
    public string ProductId { get; init; } = "";
    public string Stage { get; init; } = "";
    public string AuditStatus { get; init; } = "";
    public string ReleaseStatus { get; init; } = "";
    public List<string> FailureCodes { get; init; } = [];
    public string UpdatedAt { get; init; } = "";
}
