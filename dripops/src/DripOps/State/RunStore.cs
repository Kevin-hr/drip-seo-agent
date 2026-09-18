using System.Text.Json;
using DripOps.Configuration;
using DripOps.Domain;

namespace DripOps.State;

public sealed class RunStore
{
    private readonly string _root;

    public RunStore(string root)
    {
        _root = Path.GetFullPath(root);
        Directory.CreateDirectory(_root);
    }

    public string CreateRun(string categoryAdminUrl, string? categoryPublicUrl, string standardVersion, string? requestedRunId = null)
    {
        var runId = SanitizeRunId(requestedRunId ?? DateTimeOffset.Now.ToString("yyyy-MM-ddTHH-mm-sszzz").Replace(":", "-"));
        var directory = RunDirectory(runId);
        if (Directory.Exists(directory)) throw new IOException($"Run already exists: {runId}");
        Directory.CreateDirectory(ProductDirectory(runId));
        Directory.CreateDirectory(Path.Combine(directory, "evidence"));
        Directory.CreateDirectory(Path.Combine(directory, "reports"));
        var state = new RunState
        {
            RunId = runId,
            StandardVersion = standardVersion,
            CategoryAdminUrl = categoryAdminUrl,
            CategoryPublicUrl = categoryPublicUrl
        };
        SaveRun(state);
        AppendEvent(runId, "RUN_CREATED", new { categoryAdminUrl, categoryPublicUrl, standardVersion });
        return runId;
    }

    public RunState LoadRun(string runId)
    {
        var path = Path.Combine(RunDirectory(runId), "run.json");
        if (!File.Exists(path)) throw new FileNotFoundException($"Run not found: {runId}");
        return JsonSerializer.Deserialize<RunState>(File.ReadAllText(path), JsonOptions.Default)
               ?? throw new InvalidDataException($"Invalid run state: {path}");
    }

    public void SaveRun(RunState state)
    {
        var updated = state with { UpdatedAt = DateTimeOffset.Now };
        AtomicWrite(Path.Combine(RunDirectory(state.RunId), "run.json"), JsonSerializer.Serialize(updated, JsonOptions.Default));
    }

    public void SaveCategorySnapshot(string runId, CategorySnapshot snapshot)
    {
        AtomicWrite(Path.Combine(RunDirectory(runId), "category-snapshot.json"), JsonSerializer.Serialize(snapshot, JsonOptions.Default));
        var state = LoadRun(runId) with
        {
            CategorySnapshot = snapshot,
            ProductIds = snapshot.Products.Select(product => product.ProductId).ToList()
        };
        SaveRun(state);

        foreach (var row in snapshot.Products)
        {
            var existing = TryLoadProduct(runId, row.ProductId);
            var job = existing ?? new ProductJob
            {
                ProductId = row.ProductId,
                AdminUrl = row.AdminUrl,
                CategoryIndex = row.Index
            };
            SaveProduct(runId, job);
        }
        AppendEvent(runId, "CATEGORY_SNAPSHOT_SAVED", new { snapshot.Total, snapshot.Published, snapshot.Unpublished });
    }

    public ProductJob? TryLoadProduct(string runId, string productId)
    {
        var path = ProductPath(runId, productId);
        if (!File.Exists(path)) return null;
        return JsonSerializer.Deserialize<ProductJob>(File.ReadAllText(path), JsonOptions.Default);
    }

    public ProductJob LoadProduct(string runId, string productId) =>
        TryLoadProduct(runId, productId) ?? throw new FileNotFoundException($"Product job not found: {runId}/{productId}");

    public IReadOnlyList<ProductJob> LoadProducts(string runId)
    {
        var state = LoadRun(runId);
        return state.ProductIds.Select(id => LoadProduct(runId, id)).OrderBy(job => job.CategoryIndex).ToList();
    }

    public void SaveProduct(string runId, ProductJob job)
    {
        var updated = job with { UpdatedAt = DateTimeOffset.Now };
        AtomicWrite(ProductPath(runId, job.ProductId), JsonSerializer.Serialize(updated, JsonOptions.Default));
        AppendEvent(runId, "PRODUCT_CHECKPOINT", new
        {
            job.ProductId,
            stage = updated.Stage.ToString(),
            auditStatus = updated.InputAuditStatus.ToString(),
            releaseStatus = updated.ReleaseStatus.ToString()
        });
    }

    public IDisposable AcquireRunLock(string runId)
    {
        Directory.CreateDirectory(RunDirectory(runId));
        var path = Path.Combine(RunDirectory(runId), ".lock");
        try
        {
            var stream = new FileStream(path, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
            stream.SetLength(0);
            using var writer = new StreamWriter(stream, leaveOpen: true);
            writer.Write($"pid={Environment.ProcessId}; acquired={DateTimeOffset.Now:O}");
            writer.Flush();
            stream.Position = 0;
            return new RunLock(stream, path);
        }
        catch (IOException ex)
        {
            throw new IOException($"Run is already locked by another DripOps process: {runId}", ex);
        }
    }

    public void AppendEvent(string runId, string eventType, object payload)
    {
        Directory.CreateDirectory(RunDirectory(runId));
        var envelope = new
        {
            eventId = Guid.NewGuid().ToString("N"),
            eventType,
            timestamp = DateTimeOffset.Now,
            payload
        };
        File.AppendAllText(Path.Combine(RunDirectory(runId), "events.jsonl"),
            JsonSerializer.Serialize(envelope, JsonOptions.Default) + Environment.NewLine);
    }

    public string RunDirectory(string runId) => Path.Combine(_root, SanitizeRunId(runId));
    private string ProductDirectory(string runId) => Path.Combine(RunDirectory(runId), "products");
    private string ProductPath(string runId, string productId) => Path.Combine(ProductDirectory(runId), $"{productId}.json");

    private static string SanitizeRunId(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string(value.Select(c => invalid.Contains(c) ? '-' : c).ToArray()).Trim();
        if (string.IsNullOrWhiteSpace(sanitized)) throw new ArgumentException("Run id is empty after sanitization.");
        return sanitized;
    }

    private static void AtomicWrite(string path, string content)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temp = path + ".tmp-" + Guid.NewGuid().ToString("N");
        File.WriteAllText(temp, content);
        File.Move(temp, path, true);
    }

    private sealed class RunLock(FileStream stream, string path) : IDisposable
    {
        public void Dispose()
        {
            stream.Dispose();
            try { File.Delete(path); } catch { /* lock removal is best effort */ }
        }
    }
}
