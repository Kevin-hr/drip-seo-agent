namespace DripOps.TypeSafe;

/// <summary>
/// Configuration for the DripOps → TypeSafe System One adapter.
///
/// TypeSafe is a hosted API that answers narrow, atomic questions (Choice / Noul /
/// Score) about a shared `state`. This config is deliberately inert unless an API
/// key is present at runtime: reading the key from an environment variable keeps
/// secrets out of config files, and every consumer treats "no key" as "judgments
/// are unavailable", never as "judgments succeeded".
/// </summary>
public sealed record TypeSafeOptions
{
    /// <summary>TypeSafe System One endpoint. Defaults to the hosted API.</summary>
    public string Endpoint { get; init; } = "https://api.typesafe.ai/v1/systemone";

    /// <summary>Model to route to. Defaults to jev-latest per the official quick start.</summary>
    public string Model { get; init; } = "jev-latest";

    /// <summary>
    /// Name of the environment variable holding the bearer API key. When unset or
    /// empty, the client has no credentials and refuses to send.
    /// </summary>
    public string ApiKeyEnvironmentVariable { get; init; } = "TYPESAFE_API_KEY";

    /// <summary>
    /// Hard switch. When false, no TypeSafe calls are attempted and judgment
    /// sessions resolve to "unavailable". Keep false until a key is provisioned.
    /// </summary>
    public bool Enabled { get; init; }

    /// <summary>
    /// Noul probability at or above which a single piece of evidence is treated as
    /// explicitly supporting the SKU. Kept in config so thresholds can be tuned
    /// without a code change (TypeSafe's own guidance on routing by confidence).
    /// </summary>
    public double NoulSupportThreshold { get; init; } = 0.85;

    /// <summary>Score at or above which a source is treated as high-priority.</summary>
    public double ScoreHighThreshold { get; init; } = 0.7;

    public bool HasCredentials =>
        Enabled && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(ApiKeyEnvironmentVariable));
}