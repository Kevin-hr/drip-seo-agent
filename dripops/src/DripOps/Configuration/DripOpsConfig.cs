using System.Text.Json;

namespace DripOps.Configuration;

public sealed record AiProviderConfig
{
    public string Name { get; init; } = "manual-file";
    public string Kind { get; init; } = "file";
    public bool Enabled { get; init; } = true;
    public string? Endpoint { get; init; }
    public string? Model { get; init; }
    public string? ApiKeyEnvironmentVariable { get; init; }
}

public sealed record TrustClaimsConfig
{
    public bool QcPhotosVerified { get; init; }
    public bool ThirtyDayReturnsVerified { get; init; }
    public bool DeliveryWindowVerified { get; init; }
    public string DeliveryWindow { get; init; } = "7-20 day delivery";
    public DateTimeOffset? VerifiedAt { get; init; }
}

public sealed record DripOpsConfig
{
    public string StoreOrigin { get; init; } = "https://www.dripsneakers.org";
    public string AdminOrigin { get; init; } = "https://www.mrshopplus.com";
    public string ChromeProfileDirectory { get; init; } = "data/chrome-profile";
    public string? ChromeExecutablePath { get; init; }
    public int ChromeDebugPort { get; init; } = 9333;
    public string StateDirectory { get; init; } = "data/runs";
    public string ExchangeDirectory { get; init; } = "data/ai-exchange";
    public string StandardPath { get; init; } = "standards/SEO-PDP-3.2.json";
    public bool Headless { get; init; }
    public bool AutoPublishPassOnly { get; init; } = true;
    public TrustClaimsConfig TrustClaims { get; init; } = new();
    public List<AiProviderConfig> AiProviders { get; init; } = [new()];

    // ---------------------------------------------------------------- V4.4 / Bridge
    //
    // The bridge's decision layer is SEO-PDP V4.4 STANDARD_FINAL only.
    // `StandardPath` above is retained for the historical 3.2 CLI commands and is
    // never consulted by the bridge.

    /// <summary>Machine-readable projection of the canonical V4.4 standard.</summary>
    public string StandardV44Path { get; init; } = "standards/SEO-PDP-V4.4.json";

    /// <summary>Canonical V4.4 Markdown document; its SHA-256 identifies the standard.</summary>
    public string StandardV44DocumentPath { get; init; } =
        "standards/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md";

    /// <summary>Where immutable plans and bridge evidence are stored.</summary>
    public string BridgeDirectory { get; init; } = "data/bridge";

    public int BridgePort { get; init; } = 8787;
    public string BridgeHost { get; init; } = "127.0.0.1";

    /// <summary>
    /// "live" performs real MrShopPlus writes. "simulate" exercises the full guard
    /// chain without contacting MrShopPlus, and marks the result as SIMULATED so it
    /// can never be mistaken for a real write.
    /// </summary>
    public string ExecutionMode { get; init; } = "live";

    /// <summary>
    /// P0-2: maximum age of a local product snapshot, in hours, before the bridge
    /// refuses to plan against it. Applies to products that already have a
    /// storefront URL. snapshot_hash proves the plan matches the stored snapshot; it
    /// does not prove the stored snapshot matches reality, so age is enforced
    /// separately. Set to 0 to disable.
    /// </summary>
    public int SnapshotMaxAgeHours { get; init; } = 24;

    /// <summary>
    /// Agent Contract V2.0 §4: refuse to plan when the snapshot is missing one of
    /// the four STOP-condition fields (images, description, SEO fields, variants).
    ///
    /// The completeness report is always computed and returned. This switch only
    /// decides whether an incomplete snapshot halts the run. It defaults to false
    /// so that the report can be observed before it is enforced, and so that the
    /// existing acceptance suites keep exercising the guard chain; production is
    /// expected to set it to true once a variants reader exists.
    /// </summary>
    public bool RequireCompleteSnapshot { get; init; }

    public static DripOpsConfig Load(string path)
    {
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Config file not found: {path}");
        }

        var config = JsonSerializer.Deserialize<DripOpsConfig>(File.ReadAllText(path), JsonOptions.Default);
        return config ?? throw new InvalidDataException($"Invalid config: {path}");
    }

    public DripOpsConfig ResolvePaths(string baseDirectory)
    {
        static string Resolve(string root, string value) => Path.IsPathRooted(value)
            ? Path.GetFullPath(value)
            : Path.GetFullPath(Path.Combine(root, value));

        return this with
        {
            ChromeProfileDirectory = Resolve(baseDirectory, ChromeProfileDirectory),
            StateDirectory = Resolve(baseDirectory, StateDirectory),
            ExchangeDirectory = Resolve(baseDirectory, ExchangeDirectory),
            StandardPath = Resolve(baseDirectory, StandardPath),
            StandardV44Path = Resolve(baseDirectory, StandardV44Path),
            StandardV44DocumentPath = Resolve(baseDirectory, StandardV44DocumentPath),
            BridgeDirectory = Resolve(baseDirectory, BridgeDirectory)
        };
    }
}

public static class JsonOptions
{
    public static readonly JsonSerializerOptions Default = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };
}
