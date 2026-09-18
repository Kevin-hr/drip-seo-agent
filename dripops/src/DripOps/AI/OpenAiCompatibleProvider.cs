using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DripOps.Configuration;

namespace DripOps.AI;

public sealed class OpenAiCompatibleProvider : IAiProvider
{
    private readonly AiProviderConfig _config;
    private readonly HttpClient _httpClient;

    public OpenAiCompatibleProvider(AiProviderConfig config, HttpClient? httpClient = null)
    {
        _config = config;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
        var apiKey = string.IsNullOrWhiteSpace(config.ApiKeyEnvironmentVariable)
            ? null
            : Environment.GetEnvironmentVariable(config.ApiKeyEnvironmentVariable);
        if (!string.IsNullOrWhiteSpace(apiKey))
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
    }

    public string Name => _config.Name;

    public async Task<AiJobResponse> EnrichAsync(AiJobRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_config.Endpoint) || string.IsNullOrWhiteSpace(_config.Model))
            throw new InvalidOperationException($"Provider {Name} requires endpoint and model.");

        var schemaExample = new AiJobResponse
        {
            ProductId = request.Snapshot.ProductId,
            AuditStatus = Domain.AuditStatus.Verify,
            FailureCodes = ["FACT-02 UNVERIFIED_SKU"],
            Notes = "Return HOLD when a required core fact cannot be verified."
        };
        var prompt = $"""
            {request.Instruction}

            Standard version: {request.StandardVersion}
            Input job:
            {JsonSerializer.Serialize(request, JsonOptions.Default)}

            Return one JSON object matching this shape:
            {JsonSerializer.Serialize(schemaExample, JsonOptions.Default)}
            """;

        var body = new
        {
            model = _config.Model,
            temperature = 0,
            messages = new[]
            {
                new { role = "system", content = "You are a product fact verification worker. Never invent missing facts, evidence, SKU, or URLs." },
                new { role = "user", content = prompt }
            }
        };

        using var response = await _httpClient.PostAsJsonAsync(_config.Endpoint, body, JsonOptions.Default, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var content = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()
                      ?? throw new InvalidDataException($"Provider {Name} returned empty content.");
        var json = ExtractJson(content);
        var result = JsonSerializer.Deserialize<AiJobResponse>(json, JsonOptions.Default)
                     ?? throw new InvalidDataException($"Provider {Name} returned invalid JSON.");
        if (!string.Equals(result.ProductId, request.Snapshot.ProductId, StringComparison.Ordinal))
            throw new InvalidDataException($"Provider {Name} returned ProductId {result.ProductId}, expected {request.Snapshot.ProductId}.");
        return result with { ProviderName = Name, ModelName = _config.Model };
    }

    private static string ExtractJson(string content)
    {
        var trimmed = content.Trim();
        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewLine = trimmed.IndexOf('\n');
            var lastFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (firstNewLine >= 0 && lastFence > firstNewLine)
                trimmed = trimmed[(firstNewLine + 1)..lastFence].Trim();
        }
        return trimmed;
    }
}
