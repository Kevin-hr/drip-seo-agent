using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using DripOps.Configuration;
using DripOps.Domain;
using DripOps.Rules.V44;

namespace DripOps.Bridge;

/// <summary>
/// Persistence for immutable V4.4 plans.
///
/// The plan payload is write-once. Only two transitions are permitted after
/// creation, and both are additive: recording the single execution, and
/// recording the verification result. The draft, the snapshot hash, and the
/// standard hash can never be rewritten.
/// </summary>
public sealed class PlanStore
{
    private readonly string _directory;

    public PlanStore(string bridgeDirectory)
    {
        _directory = Path.GetFullPath(Path.Combine(bridgeDirectory, "plans"));
        Directory.CreateDirectory(_directory);
    }

    public string Directory_ => _directory;

    public static string NewPlanId() =>
        $"plan_{DateTimeOffset.UtcNow:yyyyMMddTHHmmssfff}_{Guid.NewGuid().ToString("N")[..8]}";

    public static string ComputeSnapshotHash(ProductSnapshot snapshot)
    {
        var payload = new
        {
            snapshot.ProductId,
            snapshot.ExistingName,
            snapshot.ExistingSubtitle,
            snapshot.ExistingDescriptionHtml,
            snapshot.ExistingSeoTitle,
            snapshot.ExistingSeoKeywords,
            snapshot.ExistingMetaDescription,
            snapshot.ExistingSlug,
            snapshot.CurrentSku,
            snapshot.SupplierCode,
            snapshot.Category,
            snapshot.Price,
            snapshot.Inventory,
            snapshot.Collections,
            snapshot.Variants,
            snapshot.IsPublished,
            snapshot.ImageUrls,
        };
        var json = JsonSerializer.Serialize(payload, BridgeJson.Options);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))).ToLowerInvariant();
    }

    /// <summary>Write-once. Throws if the plan id already exists.</summary>
    public void Save(V44Plan plan)
    {
        if (string.IsNullOrWhiteSpace(plan.PlanId)) throw new ArgumentException("plan_id is required.");
        var path = PathFor(plan.PlanId);
        if (File.Exists(path))
        {
            throw new IOException($"Plan already exists and is immutable: {plan.PlanId}");
        }
        AtomicWrite(path, JsonSerializer.Serialize(plan, BridgeJson.Options));
    }

    public V44Plan? TryLoad(string planId)
    {
        if (string.IsNullOrWhiteSpace(planId)) return null;
        if (!IsValidPlanId(planId)) return null;
        var path = PathFor(planId);
        if (!File.Exists(path)) return null;
        return JsonSerializer.Deserialize<V44Plan>(File.ReadAllText(path), BridgeJson.Options);
    }

    public static bool IsValidPlanId(string planId) =>
        Regex.IsMatch(planId, @"^plan_[A-Za-z0-9_]{1,80}$");

    /// <summary>Single permitted execution transition. Rejects a second execution.</summary>
    public V44Plan MarkExecuted(string planId, V44ExecutionResult execution)
    {
        var plan = TryLoad(planId) ?? throw new FileNotFoundException($"Plan not found: {planId}");
        if (plan.Executed)
        {
            throw new InvalidOperationException($"Plan has already been executed at {plan.ExecutedAt}: {planId}");
        }

        var updated = plan with
        {
            Executed = true,
            ExecutedAt = DateTimeOffset.UtcNow.ToString("O"),
            Execution = execution,
        };
        AssertImmutableCoreUnchanged(plan, updated);
        AtomicWrite(PathFor(planId), JsonSerializer.Serialize(updated, BridgeJson.Options));
        return updated;
    }

    public V44Plan AttachVerification(string planId, List<V44Check> checks)
    {
        var plan = TryLoad(planId) ?? throw new FileNotFoundException($"Plan not found: {planId}");
        var updated = plan with
        {
            Verification = checks,
            VerifiedAt = DateTimeOffset.UtcNow.ToString("O"),
        };
        AssertImmutableCoreUnchanged(plan, updated);
        AtomicWrite(PathFor(planId), JsonSerializer.Serialize(updated, BridgeJson.Options));
        return updated;
    }

    public IReadOnlyList<string> ListPlanIds() =>
        Directory.EnumerateFiles(_directory, "plan_*.json")
            .Select(Path.GetFileNameWithoutExtension)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .Order()
            .ToList();

    private static void AssertImmutableCoreUnchanged(V44Plan before, V44Plan after)
    {
        foreach (var (name, a, b) in new[]
                 {
                     ("product_id", before.ProductId, after.ProductId),
                     ("standard_hash", before.StandardHash, after.StandardHash),
                     ("snapshot_hash", before.SnapshotHash, after.SnapshotHash),
                     ("validation_status", before.ValidationStatus, after.ValidationStatus),
                     ("draft", JsonSerializer.Serialize(before.Draft, BridgeJson.Options), JsonSerializer.Serialize(after.Draft, BridgeJson.Options)),
                 })
        {
            if (!string.Equals(a, b, StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"Plan immutability violated on '{name}': {before.PlanId}");
            }
        }
    }

    private string PathFor(string planId)
    {
        if (!Regex.IsMatch(planId, @"^plan_[A-Za-z0-9_]+$"))
        {
            throw new ArgumentException($"Invalid plan_id format: {planId}");
        }
        return Path.Combine(_directory, $"{planId}.json");
    }

    private static void AtomicWrite(string path, string content)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temp = path + ".tmp-" + Guid.NewGuid().ToString("N");
        File.WriteAllText(temp, content);
        File.Move(temp, path, true);
    }
}
