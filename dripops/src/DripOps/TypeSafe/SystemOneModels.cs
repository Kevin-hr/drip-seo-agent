using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace DripOps.TypeSafe;

/// <summary>
/// One System One question. The TypeSafe HTTP API accepts `state`, `model`, and a
/// map of `questions`. Each question carries `type`, `instructions`, and (for
/// Choice and Score) `criteria`. `instructions` and `criteria` may each be a plain
/// string or a structured JSON value; the model reads backtick dot-index paths
/// inside `instructions` when they point at the `state`.
///
/// Factories below build the three question kinds and normalise the flexible
/// `instructions`/`criteria` shapes (string OR structured) to JSON nodes.
/// </summary>
public sealed class SystemOneQuestion
{
    [JsonPropertyName("type")]
    public string Type { get; init; } = "";

    [JsonPropertyName("instructions")]
    public JsonNode? Instructions { get; init; }

    [JsonPropertyName("criteria")]
    public JsonNode? Criteria { get; init; }

    /// <summary>Pick one option from a fixed, unordered set. Returns choice + probability distribution.</summary>
    public static SystemOneQuestion Choice(object instructions, IReadOnlyDictionary<string, object> criteria) =>
        new() { Type = "choice", Instructions = TypesafeJson.ToNode(instructions), Criteria = TypesafeJson.ToNode(criteria) };

    /// <summary>Is this statement true? Returns a 0..1 probability.</summary>
    public static SystemOneQuestion Noul(object instructions, object? criteria = null) =>
        new() { Type = "noul", Instructions = TypesafeJson.ToNode(instructions), Criteria = criteria is null ? null : TypesafeJson.ToNode(criteria) };

    /// <summary>Where on an ordered spectrum does the state sit? Returns score + confidence.</summary>
    public static SystemOneQuestion Score(object instructions, IReadOnlyList<object> levels) =>
        new() { Type = "score", Instructions = TypesafeJson.ToNode(instructions), Criteria = TypesafeJson.ToNode(levels) };
}

/// <summary>Full POST body for <c>/v1/systemone</c>.</summary>
public sealed class SystemOneRequest
{
    [JsonPropertyName("model")]
    public string Model { get; init; } = "";

    [JsonPropertyName("state")]
    public JsonNode? State { get; init; }

    [JsonPropertyName("questions")]
    public Dictionary<string, SystemOneQuestion> Questions { get; init; } = new();
}

/// <summary>
/// A single typed answer. The response object carries the same id the question was
/// keyed under. The underlying JSON keeps every field; typed accessors expose the
/// shape appropriate to the question type.
/// </summary>
public sealed class SystemOneAnswer
{
    public string Type { get; init; } = "";
    public JsonElement Raw { get; init; } = default;

    /// <summary>Choice: the selected option id.</summary>
    public string? Choice => ReadString("choice");

    /// <summary>Choice / Score: how peaked the distribution is (0..1).</summary>
    public double? Confidence => TryGetProp("confidence", out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var d) ? d : null;

    /// <summary>Choice: probability per option id.</summary>
    public IReadOnlyDictionary<string, double>? Probabilities => TryGetProp("probabilities", out var v) ? v.Deserialize<Dictionary<string, double>>(TypesafeJson.Options) : null;

    /// <summary>Noul: probability the answer is yes (0..1).</summary>
    public double? Noul => TryGetProp("noul", out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var d) ? d : null;

    /// <summary>Score: position along the levels (can fall between levels).</summary>
    public double? Score => TryGetProp("score", out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var d) ? d : null;

    /// <summary>Score: level index → description, as returned by the model.</summary>
    public IReadOnlyDictionary<string, string>? Legend => TryGetProp("legend", out var v) ? v.Deserialize<Dictionary<string, string>>(TypesafeJson.Options) : null;

    /// <summary>Convenience: treat a Noul as a decisive yes above 0.5.</summary>
    public bool NoulIsYes => (Noul ?? 0) >= 0.5;

    /// <summary>Convenience: is the answer confident enough to act on without escalation?</summary>
    public bool IsConfident(double min = 0.8) => Confidence is not null && Confidence >= min;

    public SystemOneAnswer SnapshotWith(string type, JsonElement raw) => new() { Type = type, Raw = raw.Clone() };

    private string? ReadString(string name) =>
        TryGetProp(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private bool TryGetProp(string name, out JsonElement value)
    {
        if (Raw.ValueKind == JsonValueKind.Object && Raw.TryGetProperty(name, out var v)) { value = v; return true; }
        value = default; return false;
    }
}

public sealed class TypeSafeUsage
{
    [JsonPropertyName("input_tokens")]
    public int InputTokens { get; init; }

    [JsonPropertyName("output_tokens")]
    public int OutputTokens { get; init; }
}

public sealed class SystemOneResponse
{
    public string Model { get; init; } = "";
    public Dictionary<string, SystemOneAnswer> Answers { get; init; } = new();
    public TypeSafeUsage? Usage { get; init; }

    /// <summary>Parse a raw TypeSafe response body. Every answer keeps its full JSON for inspection.</summary>
    public static SystemOneResponse Parse(string json)
    {
        using var doc = JsonDocument.Parse(json, TypesafeJson.DocumentOptions);
        var root = doc.RootElement;
        var answers = new Dictionary<string, SystemOneAnswer>(StringComparer.Ordinal);
        if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("answers", out var answersElement)
            && answersElement.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in answersElement.EnumerateObject())
            {
                var kind = property.Value.ValueKind == JsonValueKind.Object && property.Value.TryGetProperty("type", out var t) && t.ValueKind == JsonValueKind.String
                    ? t.GetString()
                    : "unknown";
                answers[property.Name] = new SystemOneAnswer { Type = kind ?? "unknown", Raw = property.Value.Clone() };
            }
        }

        string model = "";
        if (root.TryGetProperty("model", out var m) && m.ValueKind == JsonValueKind.String) model = m.GetString()!;

        TypeSafeUsage? usage = null;
        if (root.TryGetProperty("usage", out var u) && u.ValueKind == JsonValueKind.Object)
            usage = u.Deserialize<TypeSafeUsage>(TypesafeJson.Options);

        return new SystemOneResponse { Model = model, Answers = answers, Usage = usage };
    }
}

/// <summary>Shared JSON helpers for the TypeSafe adapter (kept separate from the global config).</summary>
internal static class TypesafeJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static readonly JsonDocumentOptions DocumentOptions = new()
    {
        AllowTrailingCommas = true,
        CommentHandling = JsonCommentHandling.Skip,
    };

    /// <summary>Normalise a string OR structured value to a JSON node so wire serialization is exact.</summary>
    public static JsonNode? ToNode(object? value) =>
        value is null ? null : JsonSerializer.SerializeToNode(value, Options);
}