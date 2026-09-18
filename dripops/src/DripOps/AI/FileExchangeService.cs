using System.Text.Json;
using DripOps.Configuration;

namespace DripOps.AI;

public sealed class FileExchangeService
{
    private readonly string _root;

    public FileExchangeService(string root)
    {
        _root = Path.GetFullPath(root);
        Directory.CreateDirectory(Path.Combine(_root, "outbox"));
        Directory.CreateDirectory(Path.Combine(_root, "inbox"));
        Directory.CreateDirectory(Path.Combine(_root, "processed"));
    }

    public string Export(AiJobRequest request)
    {
        var path = Path.Combine(_root, "outbox", $"{request.RunId}--{request.Snapshot.ProductId}.request.json");
        AtomicWrite(path, JsonSerializer.Serialize(request, JsonOptions.Default));
        return path;
    }

    public AiJobResponse Import(string path, string expectedProductId)
    {
        var response = JsonSerializer.Deserialize<AiJobResponse>(File.ReadAllText(path), JsonOptions.Default)
                       ?? throw new InvalidDataException($"Invalid AI response: {path}");
        if (!string.Equals(response.ProductId, expectedProductId, StringComparison.Ordinal))
            throw new InvalidDataException($"AI response ProductId mismatch. Expected {expectedProductId}, got {response.ProductId}.");
        return response;
    }

    private static void AtomicWrite(string path, string content)
    {
        var temp = path + ".tmp-" + Guid.NewGuid().ToString("N");
        File.WriteAllText(temp, content);
        File.Move(temp, path, true);
    }
}
