using System.Text.Json.Nodes;
using DripOps.Rules.V44;

namespace DripOps.TypeSafe;

/// <summary>
/// One evidence source's typed judgment (SKU support via Noul, relevance via Score).
/// </summary>
public sealed record EvidenceJudgment
{
    public string Source { get; init; } = "";
    public string? Url { get; init; }
    public string? ClaimedSku { get; init; }
    public double? SkuSupport { get; init; }
    public double? Relevance { get; init; }
    public bool SupportsSku { get; init; }
    public bool HighPriority => Relevance is not null && Relevance >= 0.7;
}

/// <summary>
/// Deterministic outcome of a Drip Sneakers judgment session. The model supplies
/// narrow answers (matches / supports / relevance); this type is where control
/// returns to code and the final SKU-verdict hint is derived. It never overrides
/// the authoritative V44SkuGate — it feeds the research layer.
/// </summary>
public sealed record TypeSafeJudgmentResult
{
    public string Status { get; init; } = "UNAVAILABLE";
    public string EntityMatch { get; init; } = "";
    public List<EvidenceJudgment> Evidence { get; init; } = [];
    public List<string> Notes { get; init; } = [];

    /// <summary>Evidence judged to explicitly support the SKU, ordered by relevance (high first).</summary>
    public IReadOnlyList<EvidenceJudgment> StrongEvidence =>
        Evidence.Where(e => e.SupportsSku).OrderByDescending(e => e.Relevance ?? 0).ToList();
}

/// <summary>
/// Maps the four Drip Sneakers research questions in the TypeSafe access document
/// onto System One primitives:
///
///   "do all sources describe the same model and colorway?"   →  Choice
///   "does this source explicitly support the SKU?"          →  Noul, one per source
///   "which source should be trusted most?"                  →  Score, one per source
///   keywords / forbidden words / hash / templates           →  left to deterministic V4.4 code
///
/// Code owns the flow. TypeSafe answers each atomic question; the composition
/// below is plain deterministic logic.
/// </summary>
public sealed class DripSneakersJudgmentSession
{
    private readonly TypeSafeSystemOneClient _client;
    private readonly TypeSafeOptions _options;

    public DripSneakersJudgmentSession(TypeSafeSystemOneClient client, TypeSafeOptions options)
    {
        _client = client;
        _options = options;
    }

    public bool HasCredentials => _client.HasCredentials;

    /// <summary>Ask the full battery of questions over the resolution's evidence and combine the answers.</summary>
    public async Task<TypeSafeJudgmentResult> JudgeAsync(
        V44SkuResolution resolution,
        CancellationToken cancellationToken)
    {
        var entity = resolution.ExactEntity;
        var state = TypesafeJson.ToNode(new
        {
            exact_entity = new
            {
                brand = entity.Brand,
                model = entity.Model,
                product_type = entity.ProductType,
                colorway = entity.Colorway,
            },
            candidate_sku = resolution.Sku,
            evidence = resolution.Evidence.Select((ev, index) => new
            {
                index,
                source = ev.SourceName,
                url = ev.Url,
                claimed_sku = ev.Sku,
                snippet = ev.Notes,
            }).ToList(),
        });

        var questions = new Dictionary<string, SystemOneQuestion>(StringComparer.Ordinal)
        {
            ["entity_match"] = SystemOneQuestion.Choice(
                "Do the listed evidence sources correspond to the SAME product model and the SAME colorway as `exact_entity`?",
                new Dictionary<string, object>
                {
                    ["match"] = "The sources describe the same model and the same colorway as `exact_entity`.",
                    ["conflict"] = "The sources describe the same product but with a conflicting identity detail (model, colorway, or SKU).",
                    ["insufficient_evidence"] = "There is not enough trustworthy evidence to decide match or conflict.",
                }),
        };

        for (var i = 0; i < resolution.Evidence.Count; i++)
        {
            var ev = resolution.Evidence[i];
            questions[$"evidence_{i}_supports_sku"] = SystemOneQuestion.Noul(
                $"Regardless of whether it is a good source, does `evidence[{i}].snippet` and `evidence[{i}].url` expressly attach " +
                $"the SKU `evidence[{i}].claimed_sku` to this exact product ({entity.Brand} {entity.Model} {entity.ProductType} {entity.Colorway})? " +
                "A neutral mention counts as no. Only an explicit identifier-to-this-product statement counts as yes.");
            questions[$"evidence_{i}_relevance"] = SystemOneQuestion.Score(
                $"How trustworthy is `evidence[{i}]` as an authoritative source for this product's identity and SKU?",
                new object[]
                {
                    "No direct evidence; hearsay, unrelated, or unverifiable.",
                    "Secondary or weak; mentions the product but lacks verified detail.",
                    "Direct and specific; attaches the exact entity and SKU in a credible way.",
                });
        }

        var response = await _client.AskAsync(state, questions, cancellationToken);
        return Compose(resolution, response, _options.NoulSupportThreshold);
    }

    /// <summary>
    /// Deterministic combination of raw System One answers into a Drip verdict
    /// hint. Kept internal and synchronous so self-tests can exercise the full
    /// composition without a network call.
    /// </summary>
    internal static TypeSafeJudgmentResult Compose(
        V44SkuResolution resolution,
        SystemOneResponse response,
        double noulThreshold)
    {
        var notes = new List<string>();
        var entityMatch = response.Answers.TryGetValue("entity_match", out var match) ? (match.Choice ?? "insufficient_evidence") : "insufficient_evidence";

        // Deterministic composition: the model only supplies narrow answers.
        var evidence = new List<EvidenceJudgment>();
        for (var i = 0; i < resolution.Evidence.Count; i++)
        {
            var ev = resolution.Evidence[i];
            double? noul = response.Answers.TryGetValue($"evidence_{i}_supports_sku", out var n) ? n.Noul : null;
            double? relevance = response.Answers.TryGetValue($"evidence_{i}_relevance", out var s) ? s.Score : null;
            var supports = noul is not null && noul >= noulThreshold;
            evidence.Add(new EvidenceJudgment
            {
                Source = ev.SourceName,
                Url = ev.Url,
                ClaimedSku = ev.Sku,
                SkuSupport = noul,
                Relevance = relevance,
                SupportsSku = supports,
            });
        }

        var entityConflict = string.Equals(entityMatch, "conflict", StringComparison.OrdinalIgnoreCase);
        var strongCount = evidence.Count(e => e.SupportsSku);

        string status;
        if (string.Equals(entityMatch, "match", StringComparison.OrdinalIgnoreCase))
        {
            // V4.4: SEO starts only after the entity is locked. Entity matches; the
            // remaining question is whether any source independently supports the SKU.
            status = strongCount > 0 ? V44Verdict.VerifiedSku : V44Verdict.SkuOmit;
            notes.Add(strongCount > 0
                ? $"entity_match=match; {strongCount} evidence source(s) explicitly support the SKU at ≥{noulThreshold}."
                : $"entity_match=match but no source reaches the {noulThreshold} SKU-support threshold; publishing omits the SKU.");
        }
        else if (entityConflict)
        {
            status = V44Verdict.Hold;
            notes.Add($"entity_match={entityMatch}; identity-critical conflict detected, holding.");
        }
        else
        {
            // insufficient_evidence or any non-locked state: the exact entity is not
            // locked, so publication is held regardless of whether a source names the SKU.
            status = V44Verdict.Hold;
            notes.Add($"entity_match={entityMatch}; the exact entity is not locked, holding.");
        }

        return new TypeSafeJudgmentResult
        {
            Status = status,
            EntityMatch = entityMatch,
            Evidence = evidence,
            Notes = notes,
        };
    }
}